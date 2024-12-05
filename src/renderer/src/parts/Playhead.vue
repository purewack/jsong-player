<script setup lang="ts">
import { computed, watchEffect, ref } from 'vue'

const props = defineProps<{
    offset: number,
    ticks: number,
    totalTicks: number,
    beat: number,
    bpm: number,
}>();

const style = computed(() => {
    return { '--anim-bpm': (60 / props.bpm) + 's' }
})
const xx = computed(()=>{
    return 100 * (props.ticks / props.totalTicks) * (props.offset / props.ticks)
})
</script>

<template>
    <svg :style="style" v-if="totalTicks !== 0 && ticks !== 0">
        <rect rx="2" :x="xx + '%'" :width="100 * (ticks / totalTicks) + '%'" y="33%"
            height="64%" opacity="0.25" class="playhead play-region" />

        <rect rx="2" :x="xx + '%'"
            :width="100 * (ticks / totalTicks) * (beat / ticks) + '%'" y="33%" height="64%" opacity="0.5"
            class="playhead play-beat" />
    </svg>
</template>

<style scoped>
.play-beat {
    transition: width 100ms;
}

.current {
    fill: green;
    stroke: lightblue;
}

.current.queue {
    fill: orange;
}

.current.continue {
    fill: yellow;
}

.current.transition {
    fill: violet;
}

.next {
    fill: hotpink;
    animation: blink var(--anim-bpm, 10s) infinite;
}

.next.continue {
    fill: gold;
}

@keyframes blink {

    from,
    to {
        opacity: 0;
    }

    50% {
        opacity: 1;
    }
}
</style>