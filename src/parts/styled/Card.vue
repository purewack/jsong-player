<script setup>
defineProps({ dark: Boolean });
</script>

<template>
  <div :class="dark ? 'card dark' : 'card'">
    <slot />
  </div>
</template>

<style scoped>
.card {
  contain: paint;
  border: solid lightgray 1px;
  border-radius: 0.5rem;
  padding: 1rem;
  backdrop-filter: blur(4px);
}
.card.dark {
  background-color: rgba(30, 30, 30, 0.25);
  border-color: #222;
}
.card.dark {
  color: ivory;
}
</style>
