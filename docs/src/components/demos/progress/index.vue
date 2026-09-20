<script setup lang="ts">
import { CuProgress, CuAmount } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '其他配置']
const code = `<CuProgress :size="100" :value="0.2" :width="5">20%</CuProgress>
<CuProgress :value="0.8" color="url(#linear)" :rotate="-90" transition />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div style="display: flex; gap: 40px; align-items: center; justify-content: center; padding: 30px 0">
        <CuProgress :size="100" :value="0.2" :width="5">20%</CuProgress>
        <CuProgress :size="100" :value="0.5" :width="5">50%</CuProgress>
        <CuProgress :size="100" :value="0.8" :width="5">80%</CuProgress>
      </div>
    </template>
    <template #scene-1>
      <div style="display: flex; gap: 40px; align-items: center; justify-content: center; flex-wrap: wrap; padding: 20px 0">
        <CuProgress :value="0.8" :width="10" :size="100" color="url(#linear)" border-color="#FFF" linecap="butt">
          <span style="font-size: 24px">80%</span>
          <template #defs>
            <linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#FF5257" />
              <stop offset="100%" stop-color="#FFC541D6" />
            </linearGradient>
          </template>
        </CuProgress>
        <CuProgress :value="0.8" :width="10" :size="100" :rotate="-90" color="#FF5257" transition>
          <CuAmount :value="80" :precision="0" />
        </CuProgress>
      </div>
    </template>
  </DemoCanvas>
</template>
