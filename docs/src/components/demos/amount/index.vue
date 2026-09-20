<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CuAmount } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['千位分隔符', '变化动效', '大写中文']
const code = `<CuAmount :value="1234.125" :precision="3" />
<CuAmount :value="v" :precision="2" transition />
<CuAmount :value="1234.125" is-capital />`
const v = ref(1000)
onMounted(() => {
  setInterval(() => {
    v.value = Math.round(Math.random() * 10000)
  }, 2000)
})
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuAmount :value="1234.125" :precision="3" />
    </template>
    <template #scene-1>
      <CuAmount :value="v" :precision="2" transition />
    </template>
    <template #scene-2>
      <CuAmount :value="1234.125" is-capital />
    </template>
  </DemoCanvas>
</template>
