<script setup lang="ts">
import { CuResultPage } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['空页面', '网络异常', '页面丢失', '自定义']
const code = `<CuResultPage type="empty" />
<CuResultPage type="network" />
<CuResultPage :img-url="img" text="自定义" :buttons="buttons" />`
const buttons = [{ text: '重新加载' }, { text: '返回', plain: false }]
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="result-page-demo-box">
        <CuResultPage type="empty" />
      </div>
    </template>
    <template #scene-1>
      <div class="result-page-demo-box">
        <CuResultPage type="network" />
      </div>
    </template>
    <template #scene-2>
      <div class="result-page-demo-box">
        <CuResultPage type="lost" />
      </div>
    </template>
    <template #scene-3>
      <div class="result-page-demo-box">
        <CuResultPage text="自定义标题" subtext="自定义描述" :buttons="buttons" />
      </div>
    </template>
  </DemoCanvas>
</template>
