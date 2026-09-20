<script setup lang="ts">
import { CuActivityIndicator } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['样式', '带文案', '纵向排列']
const code = `<CuActivityIndicator type="roller" />
<CuActivityIndicator type="spinner" />
<CuActivityIndicator type="carousel" />
<CuActivityIndicator :size="40">加载中...</CuActivityIndicator>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="ai-row">
        <CuActivityIndicator type="roller" />
        <CuActivityIndicator type="spinner" />
        <CuActivityIndicator type="carousel" />
      </div>
      <div class="ai-row">
        <CuActivityIndicator type="roller" :size="40" />
        <CuActivityIndicator type="spinner" :size="40" color="#2F86F6" />
        <CuActivityIndicator type="carousel" :size="40" />
      </div>
    </template>
    <template #scene-1>
      <div class="ai-row">
        <CuActivityIndicator :text-size="14">加载中...</CuActivityIndicator>
        <CuActivityIndicator type="spinner" :text-size="14">提交中，请稍候</CuActivityIndicator>
      </div>
    </template>
    <template #scene-2>
      <div class="ai-row">
        <CuActivityIndicator vertical :size="30">加载中...</CuActivityIndicator>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.ai-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 12px;
}
</style>