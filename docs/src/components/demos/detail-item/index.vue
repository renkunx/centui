<script setup lang="ts">
import { CuDetailItem } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '加粗', '插槽']
const code = `<CuDetailItem title="标题" content="内容" />
<CuDetailItem title="标题" content="内容" bold />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuDetailItem title="标题" content="内容内容内容" />
    </template>
    <template #scene-1>
      <CuDetailItem title="标题" content="加粗内容" bold />
    </template>
    <template #scene-2>
      <CuDetailItem title="标题">
        <span style="color: #2f86f6">插槽内容 ¥128.00</span>
      </CuDetailItem>
    </template>
  </DemoCanvas>
</template>
