<script setup lang="ts">
import { MdProgress, MdAmount } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '其他配置']
const code = `<MdProgress :size="100" :value="0.2" :width="5">20%</MdProgress>
<MdProgress :value="0.8" color="url(#linear)" :rotate="-90" transition />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div style="display: flex; gap: 40px; align-items: center; justify-content: center; padding: 30px 0">
        <MdProgress :size="100" :value="0.2" :width="5">20%</MdProgress>
        <MdProgress :size="100" :value="0.5" :width="5">50%</MdProgress>
        <MdProgress :size="100" :value="0.8" :width="5">80%</MdProgress>
      </div>
    </template>
    <template #scene-1>
      <div style="display: flex; gap: 40px; align-items: center; justify-content: center; flex-wrap: wrap; padding: 20px 0">
        <MdProgress :value="0.8" :width="10" :size="100" color="url(#linear)" border-color="#FFF" linecap="butt">
          <span style="font-size: 24px">80%</span>
          <template #defs>
            <linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#FF5257" />
              <stop offset="100%" stop-color="#FFC541D6" />
            </linearGradient>
          </template>
        </MdProgress>
        <MdProgress :value="0.8" :width="10" :size="100" :rotate="-90" color="#FF5257" transition>
          <MdAmount :value="80" :precision="0" />
        </MdProgress>
      </div>
    </template>
  </DemoCanvas>
</template>
