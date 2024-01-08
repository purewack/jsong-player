<script setup lang="ts">
import { ref, provide } from "vue";
import _ from "lodash";

import JSONg from 'jsong-audio/src'
import testJSONg from "./test.json";

import Logo from "./parts/Logo.vue";
import Volume from "./parts/Volume.vue";
import Control from "./parts/Control.vue";
import Timeline from "./parts/Timeline.vue";
import MapSection from "./parts/MapSection.vue";
import Card from "./parts/styled/Card.vue";

const dark = ref(false);
provide("theme", dark);


const position = ref('')
const player = new JSONg('all');
player.parse('sample/audio.jsong');
player.addEventListener('onTransport',(ev)=>{
    position.value = ev.detail.position
})


const jsong = ref(testJSONg);
const tracks = testJSONg.tracks.map((t) => {
  return { ...t, volume: 0 };
});

const totalMeasures = _.maxBy(
  _.values(testJSONg.playback.map),
  (section) => section.region[1],
).region[1];

const unitZoom = 30;
</script>

<template>
    <nav>
    <div class="controls">
      <Control type="back" />
      <Control type="play" @click='player.play()'/>
      <Control type="next" />
    </div>
    <Logo />
  </nav>

  <main>
    <Timeline
      class="timeline"
      :beatPX="unitZoom"
      :totalMeasures="totalMeasures"
      :meter="jsong.playback.meter"
    />
    <ul v-for="(section, name) in jsong.playback.map">
      <MapSection :data="{ ...section, name }" :beatPX="unitZoom" />
    </ul>
  </main>
  <section class="meta">
    <h3>Title: {{ jsong.meta.title }}</h3>
    <h4>By: {{ jsong.meta.author }}</h4>
    <p>Version: {{ jsong.meta.projectVersion }}</p>
  </section>
  <section class="tracks">
    <ul v-for="track in tracks">
      <li class="track">
        <Volume track />
      </li>
    </ul>
  </section>
</template>

<style>
#app {
  display: grid;
  grid-template:
    "nav nav" min-content
    "time time" min-content
    "meta tracks" auto
    / 1fr 4fr;
}
nav {
  grid-area: nav;
}
main {
  overflow-x: scroll;
  height: max-content;
  grid-area: time;
}
ul {
  list-style: none;
}

.controls {
  text-align: center;
}
.logo {
  margin-left: auto;
}

.tracks {
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
