<script setup lang="ts">
import _ from 'lodash'
import { NestedIndex } from 'jsong-audio/src/types/common';
import Card from './styled/Card.vue';
import { computed } from 'vue';
const props = withDefaults(
  defineProps<{sections: string[], active: NestedIndex, depth: number, indexDepth?: any }>(),
  {depth: 0}
)
</script>
<template>
    <ol class='flow-list'> 
      <template v-for="(section, index) in props.sections">
        <FlowList v-if="typeof section !== 'string'" 
          :sections="section"
          :active="active"
          :style='`
            margin-left: 1rem;
            filter: hue-rotate(${index * 30 + 20}deg)
          `'
          :indexDepth="indexDepth ? [...indexDepth, index] : [index]"
        />
        <Card v-else
          :class="_.isEqual([...indexDepth || [], index],active) && 'active'"
        >
          {{ [...indexDepth || [], index] }}
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

  margin: 0.25rem;
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