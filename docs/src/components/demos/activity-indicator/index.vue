<script setup lang="ts">
import { MdActivityIndicator } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['样式', '带文案', '纵向排列']
const code = `<MdActivityIndicator type="roller" />
<MdActivityIndicator type="spinner" />
<MdActivityIndicator type="carousel" />
<MdActivityIndicator :size="40">加载中...</MdActivityIndicator>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="ai-row">
        <MdActivityIndicator type="roller" />
        <MdActivityIndicator type="spinner" />
        <MdActivityIndicator type="carousel" />
      </div>
      <div class="ai-row">
        <MdActivityIndicator type="roller" :size="40" />
        <MdActivityIndicator type="spinner" :size="40" color="#2F86F6" />
        <MdActivityIndicator type="carousel" :size="40" />
      </div>
    </template>
    <template #scene-1>
      <div class="ai-row">
        <MdActivityIndicator :text-size="14">加载中...</MdActivityIndicator>
        <MdActivityIndicator type="spinner" :text-size="14">提交中，请稍候</MdActivityIndicator>
      </div>
    </template>
    <template #scene-2>
      <div class="ai-row">
        <MdActivityIndicator vertical :size="30">加载中...</MdActivityIndicator>
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