<script setup lang="ts">
import { ref, reactive, provide } from "vue";
import _ from "lodash";

import "bootstrap-icons/font/bootstrap-icons.css"

import JSONg from 'jsong-audio/src'
import testJSONg from "./test.json";

import Card from "./parts/styled/Card.vue";

import Logo from "./parts/Logo.vue";
import MetaInfo from "./parts/MetaInfo.vue";
import Volume from "./parts/Volume.vue";
import Control from "./parts/Control.vue";
import Timeline from "./parts/Timeline.vue";
import MapSection from "./parts/MapSection.vue";
import FlowList from "./parts/FlowList.vue";

const dark = ref(false);
provide("theme", dark);

// const playerInfo = reactive({})
// const player = new JSONg('all');
// player.parse('sample/audio.jsong');
// player.addEventListener('onTransport',(ev: CustomEvent)=>{
//     position.value = ev.detail.position
// })

const jsong = ref(testJSONg);
const tracks = testJSONg.tracks.map((t) => {
  return { ...t, volume: 0 };
});

const beatCount = _.maxBy(
  _.values(testJSONg.playback.map),
  (section) => section.region[1],
).region[1];
const barCount = beatCount / testJSONg.playback.meter[0];
const measurements = {barCount, beatCount, meter: testJSONg.playback.meter as [number,number]}
console.log(measurements)

const pretime = testJSONg.playback.meter[0] * 2;
const posttime = beatCount;

</script>

<template>
  <nav>
    <div class="controls">
      <Control type="back" />
      <Control type="play"/>
      <Control type="next" />
      <Control type="volume" />
    </div>
    <MetaInfo :jsong='jsong' />
    <Logo />
  </nav>
  
  <section class="tracks">
    <h2 class='heading'>Tracks</h2>
    <ul v-for="track in tracks">
      <li class="track">
        <Volume track />
      </li>
    </ul>
  </section>

  <main class="sections" :style='`
    grid-template-columns: ${pretime}fr ${posttime}fr; 
  `'>
    <h2 class='heading'>Sections</h2>
    

    <Timeline 
      pre
      class="pre-timeline"
      :jsong="testJSONg"
      :measurements="measurements"
    />
    <Timeline
      :measurements="measurements"
      :jsong="testJSONg"
      :playhead="{beat: 1, region: [4,12], pause: false}"
    />
    
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
  </main>

  
</template>

<style>

nav {
  grid-area: nav;
}
.controls {
  text-align: center;
}
.meta {
  text-align: right;
  margin-left: auto;
  margin-right: 1rem;
}


main {
  height: max-content;
  grid-area: time;
}

.sections {
  display: grid;
  grid-template:
    "pre time" minmax(1rem, 8vh)
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
