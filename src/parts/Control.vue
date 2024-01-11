<template>
  <button class="control">
    <i v-if="type === 'play'" class="bi bi-play-fill"></i>
    <i v-else-if="type === 'next'" class="bi bi-fast-forward-fill"></i>
    <i v-else-if="type === 'back'" class="bi bi-stop-fill"></i>
    <i v-else-if="type === 'volume'" class="bi bi-volume-down-fill"></i>
  </button>
</template>

<script setup>
defineProps({ type: String });
</script>

<style scoped>
.control {
  font-size: 1.25rem;
  padding: 0.75rem;
  padding-bottom: 0.54rem;
}
</style>
