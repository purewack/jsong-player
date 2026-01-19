<script setup lang='ts'>
import "bootstrap-icons/font/bootstrap-icons.css"
import { ref, reactive, provide, onUnmounted, watch, onMounted } from "vue";

import JSONg from 'jsong-audio'
import { ClickEvent, StateEvent, TransportEvent } from "jsong-audio/dist/types/events";
import { PlayerIndex, PlayerManifest } from "jsong-audio/dist/types/player";
import { JSONgManifestFile } from "jsong-audio/dist/types/jsong";

import Logo from "./parts/Logo.vue";
import Control from "./parts/Control.vue";
import Timeline from "./parts/Timeline.vue";
import Playhead from "./parts/Playhead.vue";
import TimingGrain from "./parts/TimingGrain.vue";
import SectionBlock from "./parts/SectionBlock.vue";
import RecursiveLI from "./parts/RecursiveLI.vue";

import { gainToDb } from "tone";
import HelpDoc from "./parts/HelpDoc.vue";

type ElectronWindow = Window & typeof globalThis & {api: any}

const player = new JSONg();
const playing = ref(false);
const errorInfo = ref('');
const songInfo = ref<PlayerManifest>()
const dynamicInfo = reactive({
  click: 0,
  sectionBeat: 0,

  countdown: -1,
  countdownTime: -1,
})
const timelineInfo = ref({
  meter: [4,4],
  meterBeats: 4,
  
  currentOffset: -1,
  nextOffset: -1,
  
  sectionLen:0,
  nextSectionLen:0,

  songTotalTicks: 64,
  songTotalMeasures: 16,

  grains: 0,
  bpm: 0,
  beatDuration: 0,
})

const injectStartPoint = ref('')
function skipTo(){
  try{
    if(injectStartPoint.value === JSON.stringify(player.current.index)) 
      return
    const s = JSON.parse(injectStartPoint.value)
    player.continue(s)
  }
  catch{}
}

function clickSection(index: PlayerIndex){
  if(player.state === 'stopped') {
    player.play(index)
  }
  else player.continue(index)
}

const loopIncrements = ref()
const queueIndexes = ref<{
  current: PlayerIndex,
  next?: PlayerIndex
}>({current:[], next:undefined})

const flowSections = ref()

function makeFlow(m: JSONgManifestFile){
  let end = 0;
  const f = <[number,number][]>[]
  Object.keys(m.playback.map).forEach(k => {
    const r = m.playback.map[k]
    end = Math.max(...[end,...r])
    f.push(r)
  })
  timelineInfo.value.songTotalMeasures = end
  timelineInfo.value.songTotalTicks = end * player.timingInfo.meter[0]
  flowSections.value = player.sections
}



player.addEventListener('state', (ev: StateEvent)=>{
  if(ev.type === 'state'){
    playing.value = !(ev.stateNow === 'stopped' || ev.stateNow === null)
  }
})



player.addEventListener('change', ev=>{
  if(!ev.to) return
  // console.log("change",ev)
  const key = 'key_'+ev.to?.name + ev.from?.name
  pending.value = pending.value.filter((v)=>v.key !== key)

  const regionMeasures = (ev.to.region[1] - ev.to.region[0])
  timelineInfo.value.currentOffset = ev.to.region[0] * timelineInfo.value.meterBeats
  timelineInfo.value.sectionLen = regionMeasures * timelineInfo.value.meterBeats
  timelineInfo.value.grains = regionMeasures / (ev.to.grain/player.timingInfo.meter[0])
  timelineInfo.value.nextOffset = -1
  timelineInfo.value.nextSectionLen = -1

  // flowSections.value = structuredClone(player.sections)
  loopIncrements.value = []

  injectStartPoint.value = JSON.stringify(ev.to?.index || [])
 
  queueIndexes.value = {
    current: ev.to?.index || [],
    next: undefined
  }
})

const pending = ref<any[]>([])
player.addEventListener('queue', (ev)=>{
  const key = 'key_'+ev.to?.name + ev.from?.name
  pending.value.push({key, to: ev.to, from: ev.from})
  // console.log("queue",ev)
  try{
    if(ev.to){
      timelineInfo.value.nextSectionLen = (ev.to.region[1] - ev.to.region[0]) * timelineInfo.value.meterBeats
      timelineInfo.value.nextOffset = ev.to.region[0] * timelineInfo.value.meterBeats
    }

    if(!ev.breakout)
    loopIncrements.value = structuredClone(player.getProgression().increments || null)

    queueIndexes.value = {
      current: ev.from?.index || [],
      next: ev.to?.index
    }
  }
  catch{}
  
})

player.addEventListener('cancel', (ev)=>{
  // pending.value = null
  const key = 'key_'+ev.to?.name + ev.from?.name
  // console.log("cancel",ev)
  pending.value = pending.value.filter((v)=>v.key !== key)

  timelineInfo.value.nextOffset = -1
  timelineInfo.value.nextSectionLen = -1
  loopIncrements.value = []

  queueIndexes.value = {
    current: ev.from?.index || [],
    next: undefined
  }
})

player.addEventListener('transport',(ev: TransportEvent)=>{
  dynamicInfo.click = ev.beat
  dynamicInfo.countdown = ev.countdown || -1;
  dynamicInfo.countdownTime = player.beatsCountToSeconds(ev.countdown || 0);
  
  if(!ev.progress) return
  dynamicInfo.sectionBeat = ev.progress[0]
})


function initPlayerWithManifest(m: JSONgManifestFile){
  songInfo.value = m
  timelineInfo.value.meter = player.timingInfo.meter as [number,number]
  timelineInfo.value.meterBeats = timelineInfo.value.meter[0]
  timelineInfo.value.bpm = player.timingInfo.bpm
  timelineInfo.value.beatDuration = player.timingInfo.beatDuration
  makeFlow(m.manifest)
  console.log(player,m)
  volumes.value = player.trackList.reduce((acc:{[key:string]: number},t) =>{
    acc[t.name] = 1
    return acc
  },{})
  // mute.value = player.trackList.map(t=>t.name)
  mute.value = []
  solo.value = ''
  toggles.sections = true;
  toggles.tracks = true;
  toggles.info = true;
  // player.toggleMetronome()
}


const toggles = reactive({
  tracks: false,
  sections: false,
  info: false,
  help: false,
  dark: localStorage.getItem('theme-dark') === 'true' ? true : false
})

function themeToggle(){
  toggles.dark = !toggles.dark
  localStorage.setItem('theme-dark',''+toggles.dark)
}

const srcURL = ref('')
const showModalURL = ref(false);

async function loadHosted(){
  try{
  if(srcURL.value){
    showModalURL.value = false;
    await loadFromURL(srcURL.value)
  }
  }
  catch(e){
    console.error(e)
    errorInfo.value = e
  }
}

async function loadFromSearchParam(){
  try {
    const sourceParam = sourceURL.value
    sourceURL.value = false;
    
    if(!sourceParam) {
      console.error('no param')
    }
    
    const url = decodeURIComponent(sourceParam)
    console.log('[web] Loading from URL:', url)
    
    await loadFromURL(url)
  }
  catch(e) {
    console.error('[web] Error loading from URL:', e)
    errorInfo.value = `Error loading from URL: ${e}`
  }
}

async function loadFromURL(sourceURL: string){
  const m = await player.parseManifest(sourceURL)
  if(!m){
    throw new Error('manifest error',m)
  }
  await player.useManifest(m)
  initPlayerWithManifest(m)
  await player.play()
  errorInfo.value = ''
}

const sourceURL = ref(false)

onMounted(async ()=>{
  const autoHelp = localStorage.getItem('jsong-help')
  if(!autoHelp)
  setTimeout(()=>{
    toggles.help = true;
    localStorage.setItem('jsong-help','true')
  },500)
  
  fetch('https://static.whitewasp.co.uk/test.jsong')
  // Try to load from URL parameter
  const params = new URLSearchParams(window.location.search)
  if(params.has('url')) sourceURL.value = params.get('url')
})

const solo = ref('')
const mute = ref<string[]>([])

async function begin(){
  await player.play()
}

async function loadFile(file,audioContent?,autoplay = true){
  const m = await player.parseManifest(file)
  if(m){
    console.log("manifest",m)
    await player.useManifest(m, {loadSound: audioContent})
    initPlayerWithManifest(m)
  }
}

async function loadFromFileBrowser(){
  toggles.help = false
  //ts-ignore
  const api = (window as ElectronWindow).api
  const result = await api.openFileDialog();
  if (result) {
    let audioContent = {};
    for (const src in result.content.sources) {
      const relativePath = result.content.sources[src]
      if(relativePath.endsWith('==')) {
        audioContent = undefined
        break
      }

      const abs = await api.resolvePath(result.folder, relativePath)
      const rawAudioFile = await api.fetchAudio(abs)
      // audioContent[src] = audioFileContent
      try{
        // console.log("trying audio", rawAudioFile)
        const decoded = await player.audioContext.decodeAudioData(rawAudioFile)
        audioContent[src] = decoded
        errorInfo.value = ''
      }
      catch(e){
        console.error(e)
        errorInfo.value = e
      }
      
    }
    // console.log("[front][load]",result.filePath,audioContent)
    // if(audioContent){
      try{
        await loadFile(result.content,audioContent)
        await player.play()
        errorInfo.value = ''
      }
      catch(e){
        errorInfo.value = e
      }
    // }
  }
}

watch(mute,(mutes)=>{
  if(!player.trackList) return
  player.trackList.forEach(t=>{
    player.trackVolumeOutput[t.name].volume.value = 0;
    if(mutes.includes(t.name)) player.trackVolumeOutput[t.name].volume.value = -200
  })
  if(mutes.includes(solo.value) || mutes.length < player.trackList.length -1)
    solo.value = ''
})

watch(solo,(toSolo)=>{
  if(!player.trackList) return
  if(!toSolo && mute.value.length === player.trackList.length-1) 
    mute.value = []
  else if(toSolo)
    mute.value = player.trackList.map(t => t.name !== toSolo ? t.name : undefined).filter(a=>a!==undefined)
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

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>

<template>
  <div class="player" :class="toggles.help && 'help-reveal'">

    <div class="spacer"></div>
  
  <div>
  <nav :class="[!toggles.dark && 'light']" class="controls max-w-screen flex items-center justify-between">
    <div class="flex flex-wrap flex-col w-32">
    <Control v-if="!playing" icon="play" @click="begin"/>
    <Control v-else icon="stop" @click="player.state === 'stopping' ? player.stop(false) : player.stop()"/>
    
    <Control v-if="dynamicInfo.countdown !== -1" class="animate-pulse text-yellow-400" @click="player.cancel()">{{dynamicInfo.countdown}}</Control>
    <Control v-else icon="fast-forward" @click="player.continue()"/>
    
    <Control icon="skip-forward" @click="player.continue(true)"></Control>
    <Control @click="skipTo" class="inject-start flex justify-center">
      <input @submit.prevent="skipTo" v-model="injectStartPoint" type="text" placeholder="[0]" class="w-16 h-8 bg-transparent text-center text-sm font-mono"></input>
    </Control>
    </div>


    <Logo class="mx-auto " @click="toggles.info = !toggles.info" :text="songInfo?.meta.title" :sub="songInfo?.meta &&('by' + songInfo?.meta.author)"></Logo>

    <div class="h-min flex justify-evenly flex-wrap flex-col">
    <Control icon="file-earmark-music" :small="true" @click="loadFromFileBrowser" />
    <Control icon="globe" :small="true" @click="showModalURL = true"/>
    
    <Control icon="volume-down" :small="true" :highlight="toggles.tracks" @click="toggles.tracks = !toggles.tracks" />
    <Control icon="calendar3-range" :small="true" :highlight="toggles.sections" @click="toggles.sections = !toggles.sections" />
    <Control icon="moon" :small="true" :highlight="toggles.dark" @click="themeToggle" />
    <Control icon="question-diamond" :small="true" :highlight="toggles.help" @click="toggles.help = !toggles.help"/>
    <Control :small="true" @click="player.toggleMetronome()" class="flex items-center justify-center w-32 h-8">
      <p class=" bg-transparent text-center text-sm font-mono">[{{dynamicInfo.click}}] {{ dynamicInfo.sectionBeat }}/{{timelineInfo.sectionLen}}</p>
    </Control>
    </div>
    <!-- <p>{{ playerInfo }}</p>
    <MetaInfo :meta="songInfo.meta" :playback="songInfo.playbackInfo" />
    <Logo />  -->
  </nav>

  <section v-if="errorInfo" class="m-8 text-xl text-red-400 w-max mx-auto">
    <code class="p-4">Error: {{ errorInfo }}</code>
  </section>
  </div>

  <HelpDoc class="help-content" :active="toggles.help"/>
  
  </div>

  <section class="w-screen my-4">
    <!-- <Timeline 
      :region=[-2,0]
      :meter="timing.meter"
      height="3rem"
      :width="`${100 * (2 / (timing.totalMeasures+2))}%`"
      :width="`${100 * (timing.totalMeasures / (timing.totalMeasures+2))}%`"
      
    /> -->
    <Timeline 
      :region="[0,timelineInfo.songTotalMeasures]"
      :meter="(timelineInfo.meter as [number,number])"
      height="3rem"
      width="100vw"
    >
      <TimingGrain v-for="g in timelineInfo.grains"
        :ticks="timelineInfo.sectionLen / timelineInfo.grains"
        :totalTicks="timelineInfo.songTotalTicks"
        :offset="timelineInfo.currentOffset + ((g-1) * (timelineInfo.sectionLen/ timelineInfo.grains))"
        :fill="dynamicInfo.sectionBeat <= (g * timelineInfo.sectionLen/timelineInfo.grains) && dynamicInfo.sectionBeat > ((g-1) * timelineInfo.sectionLen/timelineInfo.grains) ? 'gray' : 'none'"
        stroke="none"
      ></TimingGrain>

      <Playhead 
        :offset="timelineInfo.currentOffset"
        :ticks="timelineInfo.sectionLen"
        :totalTicks="timelineInfo.songTotalTicks"
        :beat="dynamicInfo.sectionBeat"
        :bpm="timelineInfo.bpm"
        class="current"
        :class="player.state"
      />

      <Playhead v-if="timelineInfo.nextOffset !== -1"
        :offset="timelineInfo.nextOffset"
        :ticks="timelineInfo.nextSectionLen"
        :totalTicks="timelineInfo.songTotalTicks"
        :beat="0"
        :bpm="timelineInfo.bpm"
        class="next"
        :class="player.state"
      />
      
    </Timeline> 
  </section>


  <h1 class='heading' v-if="toggles.sections" >Sections</h1>
  <section class="overflow-y-scroll max-w-screen ">
  <SectionBlock v-if="flowSections && toggles.sections" 
    :clickSection="clickSection" 
    :injectSection="(index)=>{player.overrideCurrent(index)}" 
    class="!mx-auto" :sections="flowSections" :loops="loopIncrements" :indexes="queueIndexes">
  </SectionBlock>
  </section>

  <h1 class='heading' v-if="toggles.tracks">Tracks</h1>
  <ul v-if="toggles.tracks" class="tracks">
    <li v-for="track in player.trackList" :key="track.name" class="track" :class="track.name">
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


  <h1 class='heading' v-if="songInfo && toggles.info">Info</h1>
  <section v-if="songInfo && toggles.info" class="flex flex-wrap justify-around gap-4 p-4">

    <div class="flex flex-col border rounded-sm p-2">
      <h2 class="heading-sm">Timing</h2>
      <b>Next event in {{(dynamicInfo.countdownTime || 0).toFixed(4)}}s</b>
      <p>BMP: {{player.timingInfo.bpm}} @ {{player.timingInfo.meter[0]}}/{{player.timingInfo.meter[1]}}  </p>
      <p>Beat Duration: {{player.timingInfo.beatDuration}}s</p>
      <p>Grain(default): {{player.timingInfo.grain}} beats</p>
    </div>  
    
    <div class="flex flex-col border rounded-sm p-2">
      <h2 class="heading-sm">Regions</h2>
      <ol>
        <li class="flex justify-between font-mono" v-for="[k,v] of Object.entries(songInfo.manifest.playback.map)" :key="k+v">
          <p>[{{k}}]:</p>
          <p> {{v}}</p>
        </li>
      </ol>
    </div>  

    <div class="flex flex-col border rounded-sm p-2">
      <h2 class="heading-sm">Flow</h2>
      <ol>
        <RecursiveLI groupClass="ml-4" elementClass="list-item list-inside list-decimal font-mono" :items="songInfo.manifest.playback.flow"/>
      </ol>
    </div>      
    
    <div class="flex flex-col border rounded-sm p-2">
      <h2 class="heading-sm">Meta</h2>
      <p>Created: {{(new Date(songInfo.meta.created * 1000)).toDateString()}} ({{songInfo.meta.created}})</p>
      <p>Version: {{songInfo.meta.version}}</p>
    </div>

  </section>

  <details v-if="songInfo && toggles.info" class="p-4">
    <summary class="p-4 rounded-sm m-[1px]">See Manifest</summary>
    <code class="text-white block max-h-[50vh] overflow-y-scroll"><pre>{{songInfo.manifest}}</pre></code>
  </details>

  <Transition>
  <div v-if="showModalURL" class="modal-input-url absolute top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 grid place-items-center" @click.self="showModalURL=false">
    <div class="bg-gray-200 p-8 rounded-sm">
      <h2 class="text-xl">Load from URL</h2>
      <input class='my-2' v-model="srcURL" type="text" placeholder="https://..."/>
      <div class="flex justify-between">
      <button style="border-width: 1px;" class="text-orange-800 border-orange-800 rounded-sm px-2 my-1"  @click="showModalURL=false">Cancel</button>
      <button style="border-width: 1px;" class="text-green-500 border-green-500 rounded-sm px-2 my-1" @click="loadHosted">Ok</button>
      </div>
    </div>
  </div>
  </Transition>

  <Transition>
  <div @click="loadFromSearchParam" v-if="sourceURL" class="modal-input-url absolute top-0 left-0 w-full h-full bg-white grid place-items-center">
    <div class="bg-gray-200 p-8 rounded-sm flex flex-col items-center gap-4">
      <Logo class="w-min"/>
      <h2 class="text-2xl underline">Click anywhere to start</h2>
      <p>Looks like the player wants to load sound from an external link
      <br/>
      Web browsers disable sound on page load
      </p>
      <code class="text-white max-w-[50vw]">loading: {{ sourceURL }}</code>
    </div>
  </div>
  </Transition>
</template>

<style>
/* 
:root {
  --color-text: #111;
  --color-background: ivory;
} */

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

main {
  height: max-content;
  grid-area: time;
}

body:has(.light) {
  --color-background: #eee;
  --color-text: #111;
}

.heading{
  font-weight: 100;
  font-size: 3rem;
  font-family: 'Josefin Sans';
  line-height: 3rem;
  margin-top: 1rem;
}
.heading-sm{
  font-weight: 300;
  font-size: 1.5rem;
  font-family: 'Josefin Sans';
  line-height: 1.5rem;
  margin-top: 0.2rem;
}


.controls > * {
  /* display: flex;
  align-items: center;
  justify-content: space-between; */
}

.inject-start input:focus-visible{
  outline: none !important;
}
.inject-start:has(input:focus-visible) {
  border-color: lightseagreen;
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

/* width */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

/* Track */
::-webkit-scrollbar-track {
  background: transparent; 
}
 
/* Handle */
::-webkit-scrollbar-thumb {
  background: #555; 
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: currentColor; 
}

.player {
    height: calc(100vh - 5rem);
    display: grid;
    grid-template-rows: auto 0fr 0fr auto;
    overflow: hidden;
    transition: grid-template-rows 1s;
}

.player.help-reveal {
    grid-template-rows: auto 0fr 1fr auto;
    overflow: scroll;
}

.help-content {
    min-height: 0;
    transition: opacity 1s;
    opacity: 0;
}

.player.help-reveal .help-content {
    opacity: 1;
}
</style>
