<template>
  <button class="control">
    <i :class="classType"></i>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ 
  type: string,
  highlight?: boolean 
}>();

const classType = computed(()=>{
  const out = (str:string)=>'bi bi-' + str + (props.highlight ? '-fill' : '')
  switch(props.type) {
    case 'volume':
    return out('volume-down')
    
    case 'info':
    return out('calendar3-range')

    case 'back':
    return out('stop')
    
    case 'next':
    return out('fast-forward')

    case 'file':
    return out('file-earmark-music')

    default: 
    return out(props.type)
  }
})
</script>

<style scoped>
.control {
  font-size: 1.25rem;
  padding: 0.75rem;
  padding-bottom: 0.54rem;
}
</style>
