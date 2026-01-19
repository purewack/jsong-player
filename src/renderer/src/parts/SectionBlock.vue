<template>
    <div class="group" :class="[depth === 0 && 'root',willLoop && 'will-loop']">
        <div class="group-info">
            <!-- <code >{{ index }}</code> -->
            <code class="loop-counter" >{{ sections.loopCurrent }} / {{ sections.loopLimit === Infinity ? '∞' : sections.loopLimit  }}</code>
        </div>
        <ol class="data" >
            <!-- <span class="loop-symbol start"></span> -->
            <li v-for="section in currentIndexes" class="entry">
                <template v-if="section.hasOwnProperty('name')"  >
                    <code @click="clickSection?.((section as PlayerSection).index )" class="section " :class="[isCurrent(section) && 'current', isNext(section) && 'next']">
                        <span class="whitespace-nowrap"> <b>{{ (section as PlayerSection).name }}</b> {{ (section as PlayerSection).index }} </span>
                        <hr/>
                        <span class="whitespace-nowrap">Region: {{ (section as PlayerSection).region }} {{ (section as PlayerSection).once ? '(Once)' : '' }}</span>
                        <span class="whitespace-nowrap">Grain: {{ (section as PlayerSection).grain }}b</span>
                        <span class="whitespace-nowrap">Fade: {{ transitionFlag(section as PlayerSection) }}</span>
                        <span class="whitespace-nowrap">Next: {{ (section as PlayerSection).next }}</span>
                    </code>
                    <button class="border text-center w-full rounded-sm" @click="injectSection?.((section as PlayerSection).index)">Inject</button>
                </template>
                <SectionBlock v-else :clickSection="clickSection" :injectSection="injectSection" :depth="depth + 1" :loops="loops" :sections="(section as PlayerSectionGroup)" :indexes="indexes"/>
            </li> 
            <!-- <span class="loop-symbol end"></span>  -->
        </ol>
    </div>
</template>

<script setup lang="ts">
import { PlayerSectionGroup, PlayerSection, PlayerIndex } from 'jsong-audio/dist/types/player';
import { computed, ref } from 'vue';

const index = ref<PlayerIndex>([])

const {sections, loops, indexes, depth = 0} = defineProps<{
    sections: PlayerSectionGroup, 
    loops?:PlayerIndex[], 
    indexes: {current: PlayerIndex, next?: PlayerIndex},
    depth?: number,
    clickSection?: (index: PlayerIndex)=>void,
    injectSection?: (index: PlayerIndex)=>void,
}>();

function transitionFlag(section:PlayerSection){
    const flag = Array(section.transition.length).fill('')
    section.transition.forEach((t,i)=>{
        if(t.duration && t.type === 'fade') flag[i] = 'X'
        else if(t.duration === 0 && t.type === 'fade') flag[i] = '|'
        else flag[i] = '#'
    })
    return (section.transitionSync ? '@ ' : '') + flag.join('-')
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

//   a = a.sort((_a,_b)=>_a>_b)
//   b = b.sort((_a,_b)=>_a>_b)

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const deepSearchRoot = (sec)=>{
    if(sec.hasOwnProperty('name')) return sec.index
    return deepSearchRoot(sec[0])
}

const currentIndexes = computed<(PlayerSectionGroup | PlayerSection)[]>(()=>{
    const a = Array(sections.sectionCount)
    for(let i=0; i<a.length; i++){
        a[i] = sections[i]
    }

    index.value = [...deepSearchRoot(sections[0]).slice(0,-1)]
    return a
})

const isNext = (section)=>{
    return arraysEqual((section as PlayerSection).index,indexes.next)
}
const isCurrent = (section)=>{
    return arraysEqual((section as PlayerSection).index,indexes.current)
}

const willLoop = computed(()=>{
    const ii = [...deepSearchRoot(sections[0]).slice(0,-1)]
    let l = false
    if(loops) loops.forEach((loop)=>{
        if(arraysEqual(loop,ii)) l = true;
    })
    return l
})

</script>

<style lang="css" scoped>
.group{
    display: flex;
    flex-direction: column;
    /* align-items: end; */
    margin-left: 4px;
    margin-top: 4px;
    width: max-content;
}

.group-info > *{
    display:block;
    border-radius: 2px;
}

.loop-counter {
    /* writing-mode: vertical-rl;
    text-orientation: mixed; */
    margin: 0;
    padding: 0;
    text-align: center;
    align-self: stretch; 
    /* border: solid currentColor 1px; */
    background-color: transparent
}
.loop-counter{
    border-bottom: solid lightblue 4px;
}
.group.will-loop .loop-counter{
    border-color: lightsalmon;
}

/* .loop-counter.loop{
    background-color: red;
} */
.data {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-items: end;
    border-radius: 4px;
}
.entry {
    flex-grow: 1;
    /* display: flex;
    flex-direction: row; */
    margin-left: 4px;
    margin-top: 4px;
}
.section {
    /* margin-inline: 16px; */
    /* border: solid currentColor 1px; */
    border-radius: 2px;
    display: grid;
    place-content: center;
    background-color: transparent;
    border: solid 1px;
    border-color: currentColor;
}

.section.current {
    border-color: lightgreen;
}
.section.next {
    border-color: lightsalmon;
}

.loop-symbol {
    background: currentColor;
    width:4px;
    height:3rem;
    margin-block:4px;
    position: relative;
}

.loop-symbol.start {
    margin-right: 16px;
}
.loop-symbol.end {
    margin-left: 16px;
}
.loop-symbol::before,
.loop-symbol::after{
    content: '';
    position: absolute;
    width:4px;
    height:4px;
    background:inherit;
    right: -8px;
}
.loop-symbol::before{
    top: calc(50% - 8px);
}
.loop-symbol::after{
    top: calc(50% + 8px);
}
.loop-symbol.end::before,
.loop-symbol.end::after {
    left: -8px;
}
</style>