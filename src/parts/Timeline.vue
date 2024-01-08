<script setup lang="ts">
import { Section } from "../types";
const { beatPX, meter, totalMeasures, totalSections, currentSection } =
  defineProps<{
    beatPX: number;
    meter: [number, number];
    totalMeasures: number;
    totalSections: Section[];
    currentSection: Section & {
      beat: number;
    };
  }>();
const time = meter[0] / (meter[1] / 4);
const major = totalMeasures / meter[1];
const minor = major * meter[0];
const size = minor * beatPX;
</script>

<template>
  <svg class="timeline" :width="size">
    <line x1="0" :x2="size" y1="100%" y2="100%" stroke="black" />
    <line
      v-for="tick in minor"
      :x1="`${(tick / minor) * size}`"
      :x2="`${(tick / minor) * size}`"
      y1="100%"
      y2="80%"
      stroke="gray"
    />
    <line
      v-for="tick in major"
      :x1="`${(tick / major) * size}`"
      :x2="`${(tick / major) * size}`"
      y1="50%"
      y2="100%"
      stroke="black"
    />
    <text
      v-for="tick in major"
      text-anchor="middle"
      :x="`${(tick / major) * size}`"
      y="40%"
    >
      {{ tick }}
    </text>
  </svg>
</template>

<style scoped>
.timeline {
  height: 100%;
}
</style>
