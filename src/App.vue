<script setup lang="ts">

import JSONg from 'jsong-audio/dist'
const player = new JSONg('all');
player.parse('sample/audio.jsong').then(()=>{
    player.play();
})

</script>

<template>
<nav>JSONg</nav>
<!-- <button @click='player.play()'>Next</button> -->
</template>

<style>

</style>
