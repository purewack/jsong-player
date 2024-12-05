<script setup lang="ts">
  const props = defineProps<{
    offset: number,
    ticks: number,
    totalTicks: number,
  }>();
</script>

<template>
    <rect rx="2"
        :x=" (100 * ((ticks / totalTicks) * ((offset) / ticks)) )+ '%'" 
        :width="100 * (ticks / totalTicks) + '%'"
        y="0%"
        height="33%"
    />
</template>