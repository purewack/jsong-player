<script setup lang="ts">
import {ref, computed} from 'vue'
import Playhead from './Playhead.vue'

const props = defineProps<{
  region: [number, number];
  meter: [number, number];
}>();


// const pre = ref(false)
const measures = computed(()=>{
  const r = props.region
  return Math.abs(r[1] - r[0])
})
const ticks = computed(()=>{
  return measures.value * props.meter[0]
})
</script>

<template>
  <svg v-if="region[1] !== region[0]" class="timeline" stroke-linecap="round">
    <line x1="0" x2="100%" y1="99%" y2="99%" />
    <line
      v-for="tick in ticks"
      :x1="`${(tick / ticks) * 100}%`"
      :x2="`${(tick / ticks) * 100}%`"
      y1="max(1rem, 50%)"
      y2="100%"
      opacity="0.5"
    />
    <line
      v-for="measure in measures"
      :x1="`${(measure / measures) * 100}%`"
      :x2="`${(measure / measures) * 100}%`"
      y1="1rem"
      y2="100%"
    />
    <text
      v-for="measure in measures"
      text-anchor="end"
      alignment-baseline="hanging"
      :x="`${(measure / measures) * 100}%`"
      y="0%"
      stroke="none"
      fill="currentColor"
    >
      {{ (measure + region[0]) }}
    </text>
    <slot></slot>
  </svg>
</template>

<style scoped>
.timeline {
  display: inline-block;
  height: 100%;
  stroke: currentColor;
}

</style>
