<script setup lang="ts">
import { MdWaterMark } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['文字水印', '插槽水印']
const code = `<MdWaterMark content="内部资料" :opacity="0.08">
  <p>页面内容</p>
</MdWaterMark>
<MdWaterMark :spacing="12">
  <template #watermark>水印</template>
</MdWaterMark>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdWaterMark class="water-mark-demo-box" content="INTERNAL" :opacity="0.15">
        <p class="water-mark-demo-content">页面业务内容</p>
      </MdWaterMark>
    </template>
    <template #scene-1>
      <MdWaterMark class="water-mark-demo-box" :spacing="12" :opacity="0.2">
        <p class="water-mark-demo-content">页面业务内容</p>
        <template #watermark>
          <span class="water-mark-demo-mark">mand-mobile</span>
        </template>
      </MdWaterMark>
    </template>
  </DemoCanvas>
</template>
