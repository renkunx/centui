<script setup lang="ts">
import { CuActionBar } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['单个按钮', '双按钮', '含文本', '禁用']
const code = `<CuActionBar :actions="actions" />
<CuActionBar :actions="actions">文本区域</CuActionBar>`
const single = [{ text: '主要按钮' }]
const double = [{ text: '次要按钮' }, { text: '主要按钮' }]
const disabled = [{ text: '禁用按钮', disabled: true }]
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="action-bar-demo-box"><CuActionBar :actions="single" /></div>
    </template>
    <template #scene-1>
      <div class="action-bar-demo-box"><CuActionBar :actions="double" /></div>
    </template>
    <template #scene-2>
      <div class="action-bar-demo-box">
        <CuActionBar :actions="double">
          <p style="font-size: 24px; color: #999">合计：<b style="color: #111">¥128.00</b></p>
        </CuActionBar>
      </div>
    </template>
    <template #scene-3>
      <div class="action-bar-demo-box"><CuActionBar :actions="disabled" /></div>
    </template>
  </DemoCanvas>
</template>
