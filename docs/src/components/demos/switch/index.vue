<script setup lang="ts">
import { ref } from 'vue'
import { CuSwitch } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['开启', '关闭', '开启不可用', '关闭不可用']
const code = `<CuSwitch v-model="isActive" />`
const on = ref(true)
const off = ref(false)
const onDisabled = ref(true)
const offDisabled = ref(false)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0><CuSwitch v-model="on" /></template>
    <template #scene-1><CuSwitch v-model="off" /></template>
    <template #scene-2><CuSwitch v-model="onDisabled" disabled /></template>
    <template #scene-3><CuSwitch v-model="offDisabled" disabled /></template>
  </DemoCanvas>
</template>
