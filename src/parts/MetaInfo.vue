<script setup lang="ts">
import { JSONgManifestFile } from "jsong-audio/src/types/jsong";
const {jsong} = defineProps<{jsong: JSONgManifestFile}>();
</script>

<template>
    <section class="meta">
        <h3><span>Title:</span> {{ jsong.meta.title }}</h3>
        <h4><span>By:</span> {{ jsong.meta.author }}</h4>
        <h6><span>Version:</span> {{ jsong.meta.projectVersion }}</h6>
    </section>
</template>

<style scoped>
.meta span{
    font-weight: 200;
}
</style>