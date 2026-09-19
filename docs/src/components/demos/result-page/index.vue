<script setup lang="ts">
import { MdResultPage } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['空页面', '网络异常', '页面丢失', '自定义']
const code = `<MdResultPage type="empty" />
<MdResultPage type="network" />
<MdResultPage :img-url="img" text="自定义" :buttons="buttons" />`
const buttons = [{ text: '重新加载' }, { text: '返回', plain: false }]
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="result-page-demo-box">
        <MdResultPage type="empty" />
      </div>
    </template>
    <template #scene-1>
      <div class="result-page-demo-box">
        <MdResultPage type="network" />
      </div>
    </template>
    <template #scene-2>
      <div class="result-page-demo-box">
        <MdResultPage type="lost" />
      </div>
    </template>
    <template #scene-3>
      <div class="result-page-demo-box">
        <MdResultPage text="自定义标题" subtext="自定义描述" :buttons="buttons" />
      </div>
    </template>
  </DemoCanvas>
</template>
