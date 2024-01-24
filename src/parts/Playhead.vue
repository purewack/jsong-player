<script setup lang="ts">
  import {computed} from 'vue'

  const props = defineProps<{
    ticks: {minor: number, major: number},
    beat?: number | [number, number];
    region?: [number, number];
  }>();
  
  const region = computed(()=>({
    start: props.region?.[0] || 0,
    end: props.region?.[1] || 0,
    width: (props.region?.[1] || 0) - (props.region?.[0] || 0)
  }))
</script>

<template>
  <svg>
  <rect 
    :x="100 * (region.start / ticks.minor) + '%'" 
    :width="100 * (region.width / ticks.minor) + '%'"
    y="40%" 
    height="60%" 
    opacity="0.25"
    class="playhead play-region"/>

  <rect 
    :x="100 * (region.start / ticks.minor) + '%'" 
    :width="100 * (typeof beat === 'number' ? ((beat || 0) / ticks.minor) : ((beat?.[0] || 0)/(beat?.[1] || 1) / ticks.major) ) + '%'"
    y="40%" 
    height="60%" 
    opacity="0.5"
    class="playhead play-beat"/>
  </svg>
</template>

<style scoped>
.play-beat {
  transition: width 100ms;
}
</style>