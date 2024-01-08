<script setup lang="ts">
import { Section } from "../types";
import Card from "../parts/styled/Card.vue";
const { data, beatPX, beat } = defineProps<{
  data: Section;
  beat: number;
  beatPX: number;
}>();
</script>

<template>
  <li
    class="section"
    :style="`
    transform:translateX(${data.region[0] * beatPX}px);
    width: ${(data.region[1] - data.region[0]) * beatPX}px;
    `"
  >
    <Card>{{ data.name }}</Card>
  </li>
</template>

<style scoped>
.section .card {
  background: lightblue;
  letter-spacing: 0.1rem;
}
.section {
  filter: brightness(1) hue-rotate(0deg);
}
</style>
