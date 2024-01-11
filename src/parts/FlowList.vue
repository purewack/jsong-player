<script setup lang="ts">
import { NestedIndex } from 'jsong-audio/src/types/common';
import Card from './styled/Card.vue';
const props = withDefaults(
  defineProps<{sections: string[], active: NestedIndex, depth: number, indexDepth: number }>(),
  {depth: 0}
)
</script>
<template>
    <ol class='flow-list'> 
      <template v-for="(section, index) in props.sections">
        <FlowList v-if="typeof section !== 'string'" 
          :sections="section"
          
          :depth="depth + 1"

          :active="active"
          :style='`
            margin-left: 1rem;
            filter: hue-rotate(${index * 30 + 20}deg)
          `'
        />
        <Card v-else :class="active[depth] === index && 'active'">
          {{ index }},{{ depth }}
        </Card>
        <span class="next-arrow" v-if="index !== props.sections.length-1">
          ⇓
        </span>
      </template>
    </ol>
</template>

<style scoped>
.flow-list {
  border: dotted 1px;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  padding: 0.25rem;
  background-color: lightblue;
}
.flow-list .card {
  padding: 0.5rem;
  background-color: white;
}
.next-arrow {
  align-self: center;
}

.active.active {
  background-color: lightseagreen;
  color: white;
}
</style>