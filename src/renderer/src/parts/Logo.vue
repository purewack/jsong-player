<template>
  <div class="logo">
    <div class="logo-content">
    <h1 class="logo-text">{{text || 'JSONg'}}</h1>
    <h2>{{sub ? 'JSONg' : 'Player'}}</h2>
    </div>
    <h3 v-if="sub">{{ sub }}</h3>
  </div>
</template>

<script setup lang="ts">
defineProps<{text?:string, sub?:string}>()
</script>

<style>
.logo * {
  font-family: "Josefin Sans";
  font-weight: 100;
  text-align: center;
}
.logo-content {
  display: flex;
  width: max-content;
}
.logo-content * {
  margin: 0;
}
.logo-content h1 {
  font-size: 3.5rem;
  line-height: 4rem;
  transform: translateY(0.5rem);
}
.logo-content h2{
  font-size: 1.5rem;
  line-height: 2rem;
  transform: translateY(0.5rem);
}
.logo-text {
  word-wrap: normal;
  max-width: 33vw;
}
</style>
