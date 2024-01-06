<script setup lang="ts">
import {ref} from 'vue'
import JSONg from 'jsong-audio/src'

const position = ref('')

const player = new JSONg('all');
player.parse('sample/audio.jsong');
player.addEventListener('onTransport',(ev)=>{
    position.value = ev.detail.position
})

</script>

<template>
    <nav>
        <div class="logo">
        <h1>JSONg</h1><h2>Player</h2>
        </div>
    </nav>

    <div class="time">
        <p>{{ position }}</p>
    </div>

    <section class="control">
        <button @click='player.play()'>Play</button>
        <button @click='player.stop(0)'>Stop</button>
    </section>
</template>

<style>
@font-face {
    font-family: "Josefin Sans";
    src: url('./assets/JosefinSans.ttf')
}
h1,h2 {
    font-family: 'Josefin Sans';
    font-weight: 100;
    margin:0;
}

#app {
    display: grid;
    grid-template: 
        "nav nav" 3rem
        "time time" 2rem 
        "ctrl ctrl" auto
        ;
    background-color: gray;
}

nav {
    grid-area: nav;
    display: flex;
    align-items: center;
}

.logo{
    display: flex;
}

.time {
    grid-area: time;
    margin: 0;
    place-self: center;
}

.control{
    grid-area: ctrl;
    place-self: center;
}
</style>
