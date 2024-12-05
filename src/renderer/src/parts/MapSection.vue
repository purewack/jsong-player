<script setup lang="ts">
import { computed } from "vue";
import Card from "../parts/styled/Card.vue";

import { Section } from "../types/types";
import { JSONgManifestFile } from "jsong-audio/src/types/jsong";

const props = defineProps<{
  data: Section;
  jsong: JSONgManifestFile,
  measurements: {
      barCount: number;
      beatCount: number;
  }
}>();

const offset = computed(()=>props.data.region[0])
const end = computed(()=>props.data.region[1])
const width = computed(()=>(props.data.region[1] - props.data.region[0]))
</script>

<template>
  <li
    class="section"
    :style="`
      --offset:${offset+1};
      --end:${end+1};
      --width:${width};
    `"
  >
    <Card>
      {{ data.name }}
      <br/>
      {{ data.region }}
      <br/>
      #{{ data?.grain || jsong.playback.grain }}
    </Card>
  </li>
</template>

<style scoped>
.section .card {
  opacity: 0.6;
  background: lightblue;
  letter-spacing: 0.1rem;
  height: 100%;
  padding: 0.25rem;
  contain: paint;
  text-wrap: nowrap;
}
</style>
