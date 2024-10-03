<script setup lang="ts">
import _ from 'lodash'
import { NestedIndex } from 'jsong-audio/src/types/common';
import Card from './styled/Card.vue';
import { computed } from 'vue';
const props = withDefaults(
  defineProps<{sections: string[], active: NestedIndex, indexDepth?: any }>(),
  {depth: 0}
)
</script>
<template>
    <ol class='flow-list'> 
      <template v-for="(section, index) in props.sections">
  
          <FlowList v-if="typeof section !== 'string'"  
            class="array"
            :sections="section"
            :active="active"
            :indexDepth="indexDepth ? [...indexDepth, index] : [index]"
          />
        
        <Card v-else
          :style="`
            filter: hue-rotate(${index * 30 + 20}deg)
          `"
          :class="_.isEqual([...indexDepth || [], index],active) && 'active'"
        >
          {{section}}
          <!-- {{ ' @ ' + [...indexDepth || [], index] }} -->
        </Card>
        <span class="next-arrow" v-if="index !== props.sections.length-1">
          ⇓
        </span>
      </template>
    </ol>
</template>

<style scoped>
.flow-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.flow-list .card {
  padding: 0.25rem;
  background-color: lightblue;
}
.next-arrow {
  align-self: center;
}


.flow-list.array{
  margin-right: 1px;
  margin-left: 0.5rem;
  /* border-inline: dotted lightgray 1px; */
}
.flow-list::before,
.flow-list::after {
  content: '';
  display: inline-block;
  height: 3px;
  margin: 1px;
  border: solid lightgray 1px;
}

.flow-list::before {
  border-bottom: none;
}
.flow-list::after {
  border-top: none;
}
.active.active {
  
}
</style>