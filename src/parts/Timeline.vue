<script setup lang="ts">
import {ref, computed} from 'vue'
import { JSONgManifestFile } from "jsong-audio/src/types/jsong";

import Playhead from './Playhead.vue'

const props =
  defineProps<{
    pre: boolean,
    measurements: {
      barCount: number;
      beatCount: number;
      meter: [number, number];
    },
    playhead?: {
      beat: number,
      region: [number, number]
    },
  }>();
 
  const ticks = computed(()=>{
    const major = props.pre ? 2 : props.measurements.barCount;
    const minor = props.pre ? props.measurements.meter[0] * 2 : props.measurements.beatCount;
    return {major, minor}
  })
</script>

<template>
  <svg class="timeline" stroke-linecap="round">
    <line x1="0" x2="100%" y1="100%" y2="100%" stroke="black" />
    <line
      v-for="tick in ticks.minor"
      :x1="`${(tick / ticks.minor) * 100}%`"
      :x2="`${(tick / ticks.minor) * 100}%`"
      y1="max(1rem, 50%)"
      y2="100%"
      stroke="gray"
    />
    <line
      v-for="tick in ticks.major"
      :x1="`${(tick / ticks.major) * 100}%`"
      :x2="`${(tick / ticks.major) * 100}%`"
      y1="1rem"
      y2="100%"
      stroke="black"
    />
    <text
      v-if="!pre"
      v-for="tick in ticks.major"
      text-anchor="middle"
      alignment-baseline="hanging"
      :x="`${((tick-1) / ticks.major) * 100}%`"
      y="0%"
    >
      {{ tick-1 }}
    </text>
    <text 
      v-else 
      v-for="tick in ticks.major"  
      text-anchor="middle"
      alignment-baseline="hanging"
      :x="`${(tick / ticks.major) * 100}%`"
      y="0%"
      >{{ -(ticks.major-tick) }}</text>

    <Playhead v-if="!pre && playhead" 
      v-bind="playhead"
      :ticks="ticks"
    />
  </svg>
</template>

<style scoped>
.timeline {
  display: inline-block;
  width: 100%;
  height: 100%;
}
</style>
