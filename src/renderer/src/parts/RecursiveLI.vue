<template>
    <ol :class="groupClass" v-if="Array.isArray(items)">
        <RecursiveLI v-for="ii in items" :elementClass="elementClass" :groupClass="groupClass" :items="ii"></RecursiveLI>
    </ol>
    <li v-else :class="elementClass">{{ items?.name ? items.name : items }}</li>
</template>

<script setup>
    defineProps({
        items: Array || Object,
        groupClass: String,
        elementClass: String
    })
</script>