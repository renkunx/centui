<script setup lang="ts">
import { ref } from 'vue'
import { MdSwitch } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['开启', '关闭', '开启不可用', '关闭不可用']
const code = `<MdSwitch v-model="isActive" />`
const on = ref(true)
const off = ref(false)
const onDisabled = ref(true)
const offDisabled = ref(false)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0><MdSwitch v-model="on" /></template>
    <template #scene-1><MdSwitch v-model="off" /></template>
    <template #scene-2><MdSwitch v-model="onDisabled" disabled /></template>
    <template #scene-3><MdSwitch v-model="offDisabled" disabled /></template>
  </DemoCanvas>
</template>
