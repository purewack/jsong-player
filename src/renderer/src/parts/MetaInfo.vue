<script setup lang="ts">
import Card from './styled/Card.vue'
import {JSONgMetadata, JSONgPlaybackInfo} from "jsong-audio/src/types/jsong";
import { ref } from "vue";

defineProps<{meta: JSONgMetadata, playback: JSONgPlaybackInfo}>();
const full = ref(false);
</script>

<template>
    <Card class="meta" :class={full} :noContain='!full' @click="full = !full">
        <h3><span>Title:</span> {{ meta.title }}</h3>
        <h4><span>By:</span> {{ meta.author }}</h4>
        <template v-if="full">
            <h6><span>Version:</span> {{ meta.projectVersion }}</h6>
            <hr/>
            <p>Tempo: {{ playback.bpm }}bpm</p>
            <p>Meter: {{playback.meter[0] }}/{{ playback.meter[1] }}</p>
            <p>Default Granularity: {{ playback.grain || 0 / playback.meter[0] }}bar</p>
        </template>
    </Card>
</template>

<style scoped>
.meta span{
    font-weight: 200;
}
.meta:hover {
    color:  darkred;
}
.meta.full {
    font-size: 1.25rem;
    z-index: 100;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
}
</style>