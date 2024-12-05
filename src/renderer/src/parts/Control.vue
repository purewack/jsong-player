<template>
  <button class="control" :class="small && 'small'">
    <i :class="classType"></i>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ 
  icon?: string,
  highlight?: boolean 
  small?: boolean
}>();

const classType = computed(()=>{
  if(!props?.icon) return ''
  
  const out = (str:string)=>'bi bi-' + str + (props.highlight ? '-fill' : '')
  return out(props.icon)
})
</script>

<style scoped>
.control {
  font-size: 1.25rem;
  padding: 0.75rem;
  padding-bottom: 0.54rem;
  
  background-color: transparent;
  border: solid currentColor 1px;
  margin: 1px;
  min-width: 3.5rem;
  min-height: 3.5rem;
  border-radius: 0.125rem;
}

.control.small {
  font-size: 1rem;
  min-width: 2.25rem;
  min-height: 2.25rem;
  padding: 0.33rem;
  padding-bottom: 0.0rem;
}
</style>
