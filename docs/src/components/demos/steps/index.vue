<script setup lang="ts">
import { ref } from 'vue'
import { MdSteps } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['横向', '带描述', '纵向']
const code = `<MdSteps :steps="steps" :current="1" />
<div class="steps-demo-box"><MdSteps :steps="stepsWithDesc" :current="2" /></div>
<div class="steps-demo-box"><MdSteps :steps="steps" :current="1" direction="vertical" /></div>`
const steps = [{ name: '第一步' }, { name: '第二步' }, { name: '第三步' }]
const stepsWithDesc = [
  { name: '下单', text: '2016-12-12' },
  { name: '付款', text: '2016-12-13' },
  { name: '发货', text: '2016-12-14' },
]
const current = ref(1)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="steps-demo-box"><MdSteps :steps="steps" :current="current" /></div>
    </template>
    <template #scene-1>
      <div class="steps-demo-box"><MdSteps :steps="stepsWithDesc" :current="2" /></div>
    </template>
    <template #scene-2>
      <div class="steps-demo-box"><MdSteps :steps="steps" :current="1" direction="vertical" /></div>
    </template>
  </DemoCanvas>
</template>
