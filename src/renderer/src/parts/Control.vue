<template>
  <button class="control">
    <i :class="classType"></i>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ 
  icon: string,
  highlight?: boolean 
}>();

const classType = computed(()=>{
  const out = (str:string)=>'bi bi-' + str + (props.highlight ? '-fill' : '')
  return out(props.icon)
})
</script>

<style scoped>
.control {
  font-size: 1.25rem;
  padding: 0.75rem;
  padding-bottom: 0.54rem;
  
  background-color: white;
  color: black;
  border: solid lightgray 1px;
  border-radius: 4px;
  margin: 1px;
  min-width: 3.5rem;
  min-height: 3.5rem;
}
</style>
