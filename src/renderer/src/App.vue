<script setup>
import "bootstrap-icons/font/bootstrap-icons.css"
import { ref, reactive, provide, onUnmounted } from "vue";
import _ from "lodash";

import JSONg from 'jsong-audio/src'

import Logo from "./parts/Logo.vue";
import MetaInfo from "./parts/MetaInfo.vue";
import Volume from "./parts/Volume.vue";
import Control from "./parts/Control.vue";
import Timeline from "./parts/Timeline.vue";
import MapSection from "./parts/MapSection.vue";
import FlowList from "./parts/FlowList.vue";
import { Tone } from "tone/build/esm/core/Tone";
import { ToneAudioBuffer } from "tone";
import axios from "axios";


const dark = ref(false);
provide("theme", dark);


// const audioContext = new AudioContext();
const songInfo = ref({})
const playerInfo = reactive({position: null, beat: 0, current: {}, next: undefined})

const player = new JSONg("sample", {verbose: 'all', debug:true});
// player.loadManifest("sample")

async function load(){
  //ts-ignore
  const api = window.api
  const result = await api.openFileDialog();
  if (result) {
    console.log("result",result)

    const audioContent = {};
    for (const src in result.content.sources) {
      const relativePath = result.content.sources[src]
      const abs = await api.resolvePath(result.folder, relativePath)
      const rawAudioFile = await api.fetchAudio(abs)
      // audioContent[src] = audioFileContent
      try{
      const decoded = await player.context.decodeAudioData(rawAudioFile)
      audioContent[src] = decoded
      }
      catch(e){
        console.error(e)
      }
    }
    console.log("[front][load]",result.filePath,audioContent)

    await player.loadManifest(result.content, {loadSound: false, soundOrigin:undefined})
    await player.loadSound(audioContent)

    songInfo.value = player.meta
  }
}

const playerDebugStats = ref('')
setInterval(()=>{
  const stats = {}
  stats.timeline = player.get('transport')
  stats.state = player.state
  stats.players = player.get('players').map(t => {
    return {
      name: t.name, 
      active: t.current === t.a ? 'A' : 'B',
      region_a: [t.a.loopStart,t.a.loopEnd],
      region_b: [t.b.loopStart,t.b.loopEnd],
      state_a: t.a.state,
      state_b: t.b.state,
      vol_a: t.a.volume.value,
      vol_b: t.b.volume.value,
    }
  })
  playerDebugStats.value = JSON.stringify(stats,undefined,2)
},100)

// player.addEventListener("transport", (ev)=>{
//   console.log(ev)
//   playerInfo.current = (ev as CustomEvent).detail
// })
// player.addEventListener('onTransport',(ev: CustomEvent)=>{
//   playerInfo.position = ev.detail.position
//   playerInfo.beat = ev.detail.loopBeatPosition
// })
// player.addEventListener('onSectionDidStart', (ev:CustomEvent)=>{
//   const idx = ev.detail.index
//   const flow = getNestedIndex(player.playbackFlowSections,idx)
//   playerInfo.current = {name: flow, index: idx, ...player.playbackMap[flow]}
// })
// player.addEventListener('onSectionWillStart', (ev:CustomEvent)=>{
//   const idx = ev.detail.index
//   const flow = getNestedIndex(player.playbackFlowSections,idx)
//   playerInfo.next = {name: flow, index: idx, ...player.playbackMap[flow]}
// })
// player.addEventListener('onSectionDidStart', (ev:CustomEvent)=>{
//   playerInfo.next = undefined
// })

// const jsong = ref(testJSONg);
// const tracks = testJSONg.tracks.map((t) => {
//   return { ...t, volume: 0 };
// });

// const beatCount = _.maxBy(
//   _.values(testJSONg.playback.map),
//   (section) => ((section.region as [number,number])[1])
// ).region[1];
// const barCount = beatCount / testJSONg.playback.meter[0];
// const measurements = {barCount, beatCount, meter: testJSONg.playback.meter as [number,number]}
// console.log(measurements)

// const pretime = testJSONg.playback.meter[0] * 2;
// const posttime = beatCount;

const toggles = reactive({
  tracks: true,
  info: false
})

onUnmounted(()=>{
  player.stop(false) 
})

</script>

<style scoped>
.stats-debug{
  background: gray;
  margin: 16px;
  padding: 16px;
  height: 400px;
  width: 400px;
  overflow-y: scroll;
}
</style>

<template>
  <!-- <p>{{ player.meterBeat.beat }}</p> -->
  <nav>
    <div class="controls">
      <Control icon="stop" @click="player.stop()"/>
      <Control icon="play" @click="player.play()"/>
      <Control icon="play" @click="player.play([2])">++</Control>
      <Control icon="fast-forward" @click="player.continue()"/>
      <Control icon="symmetry-vertical" @click="player.toggleMetronome()" />
      <Control icon="volume-down" :highlight="toggles.tracks" @click="toggles.tracks = !toggles.tracks" />
      <Control icon="calendar3-range" :highlight="toggles.info" @click="toggles.info = !toggles.info" />
      <Control icon="file-earmark-music" @click="load" />
    </div>
    <!-- <p>{{ playerInfo }}</p>
    <MetaInfo :meta="songInfo.meta" :playback="songInfo.playbackInfo" />
    <Logo /> -->
  </nav>
  
  <pre class="stats-debug">
    {{ playerDebugStats }}
  </pre>
<!--   
  <section v-if="toggles.tracks" class="tracks">
    <h2 class='heading'>Tracks</h2>
    <ul v-for="track in tracks">
      <Volume v-bind="track" />
    </ul>
  </section>

  <main 
  class="sections" 
  :style='`
    grid-template-columns: ${toggles.info ? pretime : 0}fr ${posttime}fr; 
  `'>

    <Timeline 
      pre
      class="pre-timeline"
      :jsong="testJSONg"
      :measurements="measurements"
    />
    <Timeline
      :measurements="measurements"
      :jsong="testJSONg"
      :playhead="playerInfo.current ? {beat: playerInfo.beat, region: playerInfo.current.region} : undefined"
      :next="playerInfo.next ? {beat: 0, region: playerInfo.next.region} : undefined"
    />
    
    
    <template v-if="toggles.info">
      <h2 class='heading'>Sections</h2>
      <ul class="section-blocks" :style="`
        grid-template-columns: repeat(${measurements.beatCount},1fr);
      `">
        <MapSection 
          v-for="(section, name, index) in jsong.playback.map"
          :key="name"
          :measurements="measurements"
          :jsong="testJSONg"
          :data="{ ...section, name }" 
          :style="`filter: hue-rotate(${index * 70}deg)`"
        />
      </ul> 
      <section class='flows'>
        <FlowList :active="[3,0,1]" :sections="jsong.playback.flow" />
      </section>
    </template>
  </main> -->
</template>


<style>

.controls {
  text-align: center;
  margin-right: auto;
}
.logo{
  margin-left: 1rem;
}
.meta {
  text-align: right;
}


main {
  height: max-content;
  grid-area: time;
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


.tracks {
  grid-area: tracks;
  list-style: none;
}
.track {
  display: flex;
  align-items: center;
}
.track .volume {
  margin-left: auto;
  flex-basis: 80%;
}
</style>
