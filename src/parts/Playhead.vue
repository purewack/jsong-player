<script setup lang="ts">
  import {computed} from 'vue'

  const props = defineProps<{
    ticks: {minor: number, major: number},
    beat: number;
    region: [number, number];
    pause?: boolean;
  }>();
  
  const playFill = computed(()=>{
    return props?.pause ? 'orange' : 'green'
  })
  const region = computed(()=>({
    start: props.region[0] || 0,
    end: props.region[1] || 0,
    width: (props.region[1] || 0) - (props.region[0] || 0)
  }))
</script>

<template>
  <rect 
    :x="100 * (region.start / ticks.minor) + '%'" 
    :width="100 * (region.width / ticks.minor) + '%'"
    y="40%" 
    height="60%" 
    :fill="playFill"
    opacity="0.25"/>

  <rect 
    :x="100 * (region.start / ticks.minor) + '%'" 
    :width="100 * (beat / ticks.minor) + '%'"
    y="40%" 
    height="60%" 
    :fill="playFill"
    opacity="0.5"/>

</template>