<script setup lang="ts">
import { ref } from 'vue'
import { MdStepper, MdField, MdFieldItem } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['禁用', '只读', '最小-12 最大18', '步进2 整数', '最小值4', 'step 1.3']
const code = `<MdStepper disabled />
<MdStepper read-only />
<MdStepper v-model="value" :min="-12" :max="18" />
<MdStepper v-model="value" :step="2" :min="2" is-integer />`
const value = ref(0)
const value2 = ref(3)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdField><MdFieldItem title="禁用"><MdStepper disabled /></MdFieldItem></MdField>
    </template>
    <template #scene-1>
      <MdField><MdFieldItem title="只读"><MdStepper read-only /></MdFieldItem></MdField>
    </template>
    <template #scene-2>
      <MdField><MdFieldItem title="最小值-12，最大值18"><MdStepper v-model="value" :min="-12" :max="18" /></MdFieldItem></MdField>
    </template>
    <template #scene-3>
      <MdField><MdFieldItem title="步进2, 只允许输入整数"><MdStepper v-model="value2" :step="2" :min="2" is-integer /></MdFieldItem></MdField>
    </template>
    <template #scene-4>
      <MdField><MdFieldItem title="最小值4大于默认值"><MdStepper :min="4" /></MdFieldItem></MdField>
    </template>
    <template #scene-5>
      <MdField><MdFieldItem title="step为小数1.3"><MdStepper :step="1.3" /></MdFieldItem></MdField>
    </template>
  </DemoCanvas>
</template>
