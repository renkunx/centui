<script setup lang="ts">
import { ref } from 'vue'
import { CuStepper, CuField, CuFieldItem } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['禁用', '只读', '最小-12 最大18', '步进2 整数', '最小值4', 'step 1.3']
const code = `<CuStepper disabled />
<CuStepper read-only />
<CuStepper v-model="value" :min="-12" :max="18" />
<CuStepper v-model="value" :step="2" :min="2" is-integer />`
const value = ref(0)
const value2 = ref(3)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuField><CuFieldItem title="禁用"><CuStepper disabled /></CuFieldItem></CuField>
    </template>
    <template #scene-1>
      <CuField><CuFieldItem title="只读"><CuStepper read-only /></CuFieldItem></CuField>
    </template>
    <template #scene-2>
      <CuField><CuFieldItem title="最小值-12，最大值18"><CuStepper v-model="value" :min="-12" :max="18" /></CuFieldItem></CuField>
    </template>
    <template #scene-3>
      <CuField><CuFieldItem title="步进2, 只允许输入整数"><CuStepper v-model="value2" :step="2" :min="2" is-integer /></CuFieldItem></CuField>
    </template>
    <template #scene-4>
      <CuField><CuFieldItem title="最小值4大于默认值"><CuStepper :min="4" /></CuFieldItem></CuField>
    </template>
    <template #scene-5>
      <CuField><CuFieldItem title="step为小数1.3"><CuStepper :step="1.3" /></CuFieldItem></CuField>
    </template>
  </DemoCanvas>
</template>
