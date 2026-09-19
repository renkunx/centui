<script setup lang="ts">
import { MdDetailItem } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '加粗', '插槽']
const code = `<MdDetailItem title="标题" content="内容" />
<MdDetailItem title="标题" content="内容" bold />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdDetailItem title="标题" content="内容内容内容" />
    </template>
    <template #scene-1>
      <MdDetailItem title="标题" content="加粗内容" bold />
    </template>
    <template #scene-2>
      <MdDetailItem title="标题">
        <span style="color: #2f86f6">插槽内容 ¥128.00</span>
      </MdDetailItem>
    </template>
  </DemoCanvas>
</template>
