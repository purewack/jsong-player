<script setup lang='ts'>
import "bootstrap-icons/font/bootstrap-icons.css"
import { ref, reactive, provide, onUnmounted, onMounted, watchEffect, watch } from "vue";

import JSONg from 'jsong-audio/src'

import Logo from "./parts/Logo.vue";
import MetaInfo from "./parts/MetaInfo.vue";
import Control from "./parts/Control.vue";
import Timeline from "./parts/Timeline.vue";
import MapSection from "./parts/MapSection.vue";
import FlowList from "./parts/FlowList.vue";
import { ClickEvent, ParseEvent, StateEvent } from "jsong-audio/src/types/events";
import { PlayerState } from "jsong-audio/src/types/player";
import { JSONgManifestFile } from "../../../../jsong-audio/src/types/jsong";
import Playhead from "./parts/Playhead.vue";
import TimingGrain from "./parts/TimingGrain.vue";
import { Tone } from "tone/build/esm/core/Tone";
import { gainToDb, Volume } from "tone";
import Countdown from "./parts/Countdown.vue";


const dark = ref(false);
provide("theme", dark);

// const audioContext = new AudioContext();
const songInfo = ref({})
const playerInfo = reactive({position: null, beat: 0, current: {}, next: undefined})
const click = ref([0,0])
const transport = ref([0,0])
const section = ref()
const countdown = ref()
const playing = ref(false)
const regions = ref<[number,number][]>([])
const timing = ref<{
    grains: number;
    totalTicks: number;
    totalMeasures: number;
    ticks: number;
    beat: number;
    offset: number;
    meter: [number, number];
    meterBeats: number;
    nextOffset: null | number;
    nextTicks: null | number;
    countdown: number | null;
}>({
  grains: 0,
  totalMeasures: 0,
  totalTicks: 0,
  ticks: 0,
  beat:0,
  offset: 0,
  meter: [1,1],
  meterBeats: 0,
  nextOffset: null,
  nextTicks: null,
  countdown: 0
})


function makeFlow(m: JSONgManifestFile){
  let end = 0;
  const f = <[number,number][]>[]
  Object.keys(m.playback.map).forEach(k => {
    const r = m.playback.map[k]
    end = Math.max(...[end,...r])
    f.push(r)
  })
  timing.value.totalMeasures = end
  timing.value.totalTicks = end * player.timingInfo.meter[0]
  regions.value = f
}


const player = new JSONg();

player.addEventListener('state', (ev: StateEvent)=>{
  if(ev.type === 'state'){
    playing.value = !(ev.stateNow === 'stopped' || ev.stateNow === null)

  }
})

player.addEventListener('click',(ev: ClickEvent)=>{
  click.value = ev.current
  timing.value.countdown = player.getPosition().countdown;
})
player.addEventListener('transport',(ev)=>{
  transport.value = ev.progress
  countdown.value = ev.countdown
})
player.addEventListener('change', ev=>{
  if(!ev.to) return
  section.value = ev.to
  // pending.value = null
  const key = 'key_'+ev.to?.name + ev.from?.name
  pending.value = pending.value.filter((v)=>v.key !== key)

  timing.value.nextTicks = null
  timing.value.nextOffset = null
  
  timing.value.grains = (ev.to.region[1] - ev.to.region[0]) / (ev.to.grain/player.timingInfo.meter[0])
})

const pending = ref<any[]>([])
player.addEventListener('queue', (ev)=>{
  const key = 'key_'+ev.to?.name + ev.from?.name
  pending.value.push({key, to: ev.to, from: ev.from})
  console.log("queue",ev)

  if(ev.to){
    timing.value.nextTicks = (ev.to.region[1] - ev.to.region[0]) * timing.value.meterBeats
    timing.value.nextOffset = ev.to.region[0] * timing.value.meterBeats
  }

  timing.value.countdown = player.getPosition().countdown
})
player.addEventListener('cancel', (ev)=>{
  // pending.value = null
  const key = 'key_'+ev.to?.name + ev.from?.name
  console.log("cancel",ev)
  pending.value = pending.value.filter((v)=>v.key !== key)

  timing.value.nextTicks = null
  timing.value.nextOffset = null
})
player.addEventListener('transport',(ev)=>{
  if(!ev.progress) return
  timing.value.beat = ev.progress[0]
  timing.value.ticks = ev.progress[1]
  timing.value.offset = (player?.current?.region[0] || 0) * timing.value.meterBeats
})


async function begin(){
  await player.play()
}


async function loadFile(file,audioContent?,autoplay = true){
  const m = await player.parseManifest(file)
  if(m){
    await player.useManifest(m, {loadSound: audioContent})
    songInfo.value = m
    timing.value.meter = player.timingInfo.meter as [number,number]
    timing.value.meterBeats = timing.value.meter[0]
    makeFlow(m.manifest)
    console.log(player,m)
    volumes.value = player.tracksList.reduce((acc:{[key:string]: number},t) =>{
      acc[t.name] = 1
      return acc
    },{})
    mute.value = []
    solo.value = ''
  }
}

async function loadFromFileBrowser(){
  //ts-ignore
  type ElectronWindow = Window & typeof globalThis & {api: any}
  const api = (window as ElectronWindow).api
  const result = await api.openFileDialog();
  if (result) {
    const audioContent = {};
    for (const src in result.content.sources) {
      const relativePath = result.content.sources[src]
      const abs = await api.resolvePath(result.folder, relativePath)
      const rawAudioFile = await api.fetchAudio(abs)
      // audioContent[src] = audioFileContent
      try{
        console.log("trying audio", rawAudioFile)
        const decoded = await player.audioContext.decodeAudioData(rawAudioFile)
        audioContent[src] = decoded
      }
      catch(e){
        console.error(e)
      }
      
    }
    console.log("[front][load]",result.filePath,audioContent)
    if(audioContent){
      await loadFile(result.content,audioContent)
      await player.play()
    }
  }
}

const toggles = reactive({
  tracks: false,
  info: false
})


const solo = ref('')
const mute = ref<string[]>([])

watch(mute,(mutes)=>{
  if(!player.tracksList) return
  player.tracksList.forEach(t=>{
    player.trackVolumeOutput[t.name].volume.value = 0;
    if(mutes.includes(t.name)) player.trackVolumeOutput[t.name].volume.value = -200
  })
  if(mutes.includes(solo.value) || mutes.length < player.tracksList.length -1)
    solo.value = ''
})

watch(solo,(toSolo)=>{
  if(!player.tracksList) return
  if(!toSolo && mute.value.length === player.tracksList.length-1) 
    mute.value = []
  else if(toSolo)
    mute.value = player.tracksList.map(t => t.name !== toSolo ? t.name : undefined).filter(a=>a!==undefined)
},{immediate:true})

const volumes = ref<{[key:string]:number}>({})
watch(volumes, (to)=>{
  if(!player) return
  Object.keys(to).forEach(tr=>{
    player.trackVolumeControls[tr].volume.value = gainToDb(to[tr])
  })
},{immediate:true, deep:true})

onUnmounted(()=>{
  player.stop(false)
})

onMounted(async ()=>{
  await loadFile("sample")
  
})


</script>

<style scoped>
.stats-debug{
  background: gray;
  margin: 16px;
  padding: 16px;
  height: 80vh;
  width: 500px;
  overflow-y: scroll;
}
</style>

<template>

  <Logo></Logo>

  <nav class="controls max-w-screen flex items-center">
    <div>
    <Control v-if="!playing" icon="play" @click="begin"/>
    <Control v-else icon="stop" @click="player.state === 'stopping' ? player.stop(false) : player.stop()"/>
    
    <Control v-if="pending.length" class="animate-pulse text-yellow-400" @click="player.cancel()">{{timing.countdown}}</Control>
    <Control v-else icon="fast-forward" @click="player.continue()"/>
    
    <Control icon="skip-forward" @click="player.continue(true)"></Control>
    <!-- <Control icon="fast-forward" @click.self="player.continue(JSON.parse(startPoint!))">
      <input v-model="startPoint" type="text" placeholder="[0]" class="w-16"></input>
    </Control> -->
    </div>

    <div class="ml-auto h-min">
    <Control icon="symmetry-vertical" :small="true" @click="player.toggleMetronome()" />
    <Control icon="volume-down" :small="true" :highlight="toggles.tracks" @click="toggles.tracks = !toggles.tracks" />
    <Control icon="calendar3-range" :small="true" :highlight="toggles.info" @click="toggles.info = !toggles.info" />
    <Control icon="file-earmark-music" :small="true" @click="loadFromFileBrowser" />
    </div>
    <!-- <p>{{ playerInfo }}</p>
    <MetaInfo :meta="songInfo.meta" :playback="songInfo.playbackInfo" />
    <Logo />  -->
  </nav>


  <section class="w-screen">
    <Timeline 
      :region=[-2,0]
      :meter="timing.meter"
      height="3rem"
      :width="`${100 * (2 / (timing.totalMeasures+2))}%`"
    />
    <Timeline 
      :region="[0,timing.totalMeasures]"
      :meter="timing.meter"
      :width="`${100 * (timing.totalMeasures / (timing.totalMeasures+2))}%`"
      height="3rem"
    >
      <TimingGrain v-for="g in timing.grains"
        :ticks="timing.ticks / timing.grains"
        :totalTicks="timing.totalTicks"
        :offset="timing.offset + ((g-1) * (timing.ticks / timing.grains))"
        :fill="timing.beat <= (g * timing.ticks/timing.grains) && timing.beat > ((g-1) * timing.ticks/timing.grains) ? 'white' : 'none'"
        stroke="none"
        style="mix-blend-mode: difference"
      ></TimingGrain>
      <Playhead 
        :offset="timing.offset"
        :ticks="timing.ticks"
        :totalTicks="timing.totalTicks"
        :beat="timing.beat"
        :bpm="player.timingInfo.bpm"
        class="current"
        :class="player.state"
      />
      <Playhead v-if="timing.nextTicks !== null"
        :offset="timing.nextOffset!"
        :ticks="timing.nextTicks"
        :totalTicks="timing.totalTicks"
        :beat="player.state === 'transition' ? timing.beat : 0"
        :bpm="player.timingInfo.bpm"
        class="next"
        :class="player.state"
      />
      
    </Timeline> 
  </section>
  
  <h1 class='heading' v-if="toggles.tracks">Tracks</h1>
  <ul v-if="toggles.tracks" class="tracks">
    <li v-for="track in player.tracksList" :key="track.name" class="track" :class="track.name">
      <div class="track-title border h-9 flex flex-row-reverse items-center">
        <span class="w-min px-1">{{ track.name }}</span>
      </div>

      <Control 
        @click="solo = track.name === solo ? '' : track.name" 
        :class="solo === track.name && 'text-yellow-400'" small
      >S</Control>
      <Control 
        @click="()=>{if(mute.includes(track.name)){mute = mute.filter(a=>a!==track.name)} else {mute = [...mute, track.name]}}" 
        :class="mute.includes(track.name) ? 'text-red-400' : ''" small
      >M</Control>
      
      <input v-model="volumes[track.name]" class="track-slider" type="range" max="1" min="0" step="0.01" />
      
    </li>
  </ul>


</template>


<style>
.code-debug {
  display: block;
}

main {
  height: max-content;
  grid-area: time;
}

/* :root {
  --color-text: #111;
  --color-background: ivory;
} */


.heading{
  font-weight: 100;
  font-size: 3rem;
  font-family: 'Josefin Sans';
  line-height: 3rem;
  margin-top: 1rem;
}

.controls > * {
  /* display: flex;
  align-items: center;
  justify-content: space-between; */
}


.sections {
  display: grid;
  grid-template:
    "pre time" 2.25rem
    "title content" min-content;
}
.sections .heading {
  writing-mode: vertical-rl;
  margin-top: 0.5rem;
}
.sections .heading,
.sections .flows {
  grid-area: title;
}

.pre-timeline {
  grid-area: pre;
}
.timeline.timeline {
  place-self: flex-end;
}

.section-blocks {
  display: grid;
  grid-auto-rows: min-content;
}
.section-blocks .section {
  display:block;
  margin: 2px;
  grid-column-start: var(--offset);
  grid-column-end: var(--end);
}


.flow {
  grid-area: flow;
}
.flows{
  overflow-y: scroll;
}



.track {
  display: grid;
  gap: 1px;
  grid-template-columns: 8rem min-content min-content auto ;
  margin: 1px;
  align-items: center;
}

.track-button[type="radio"]{
  display: none;
}
.track-button-label {
  border-color: currentColor;
  @apply w-6 h-6 border rounded-sm text-center;
}
.track:has(.track-button[type="radio"]:checked) .track-button-label {
  color: gold;
}
.track-title{
  /* background-color: red; */
  text-transform: uppercase;
  max-width: 8rem;
}
.track-title > * {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.track-slider {
  -webkit-appearance: none; /* Override default CSS styles */
  appearance: none;
  outline: none; /* Remove outline */
  -webkit-transition: 0.2s; /* 0.2 seconds transition on hover */
  transition: opacity 0.2s;
  border: solid currentColor 1px;
  background: none;
  @apply rounded-sm h-9;
}


/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */
.track-slider::-webkit-slider-thumb {
  -webkit-appearance: none; /* Override default look */
  appearance: none;
  cursor: pointer; /* Cursor on hover */
  background: currentColor; /* Green background */
  opacity: 0.2; /* Set transparency (for mouse-over effects on hover) */
  @apply rounded-sm h-9 w-9;
}/* Mouse-over effects */

.track-slider:hover::-webkit-slider-thumb{
  opacity: 1; /* Fully shown on mouse-over */
}

</style>
