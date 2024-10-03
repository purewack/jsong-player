<script setup lang="ts">
import { ref, watch } from "vue";
const props = defineProps<{ name: string }>();
</script>

<template>
  <li class="track">
    <button>Solo</button>
    <button>Mute</button>
    <span class="title">{{ name }}</span>
    <input class="slider" type="range" max="1" min="0" step="0.01" />
  </li>
</template>

<style scoped>
.track {
  display: flex;
}
.slider {
  width: 70%;
}
.title{
  margin-inline: auto;
  text-transform: uppercase;
}

.slider {
  -webkit-appearance: none; /* Override default CSS styles */
  appearance: none;
  height: 16px;
  padding: 1px;
  outline: none; /* Remove outline */
  opacity: 0.7; /* Set transparency (for mouse-over effects on hover) */
  -webkit-transition: 0.2s; /* 0.2 seconds transition on hover */
  transition: opacity 0.2s;
  border-radius: 0.25rem;
  border: solid lightgray 1px;
  background: none;
}

/* Mouse-over effects */
.slider:hover {
  opacity: 1; /* Fully shown on mouse-over */
}

/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; /* Override default look */
  appearance: none;
  width: 25px; /* Set a specific slider handle width */
  height: 16px; /* Slider handle height */
  cursor: pointer; /* Cursor on hover */
  border-radius: 0.25rem;
  background: black; /* Green background */
}
</style>
