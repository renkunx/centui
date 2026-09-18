<script setup lang="ts">
import { ref } from 'vue'
import { MdSlider } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '范围选择', '格式化', '禁用']
const code = `<MdSlider v-model="value" />
<MdSlider v-model="rangeValue" range />
<MdSlider v-model="value" :format="(v) => v + '%'" />`
const basic = ref(50)
const range = ref<[number, number]>([20, 60])
const format = ref(70)
const disabled = ref(40)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="slider-demo-block">
        <MdSlider v-model="basic" />
        <p class="slider-demo-value">当前值：{{ basic }}</p>
      </div>
    </template>
    <template #scene-1>
      <div class="slider-demo-block">
        <MdSlider v-model="range" range />
        <p class="slider-demo-value">区间：{{ range[0] }} - {{ range[1] }}</p>
      </div>
    </template>
    <template #scene-2>
      <div class="slider-demo-block">
        <MdSlider v-model="format" :format="(v: number) => `${v}%`" />
        <p class="slider-demo-value">拖动手柄查看提示</p>
      </div>
    </template>
    <template #scene-3>
      <div class="slider-demo-block">
        <MdSlider v-model="disabled" disabled />
        <p class="slider-demo-value">禁用状态</p>
      </div>
    </template>
  </DemoCanvas>
</template>
