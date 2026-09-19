<script setup lang="ts">
import { MdActionBar } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['单个按钮', '双按钮', '含文本', '禁用']
const code = `<MdActionBar :actions="actions" />
<MdActionBar :actions="actions">文本区域</MdActionBar>`
const single = [{ text: '主要按钮' }]
const double = [{ text: '次要按钮' }, { text: '主要按钮' }]
const disabled = [{ text: '禁用按钮', disabled: true }]
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="action-bar-demo-box"><MdActionBar :actions="single" /></div>
    </template>
    <template #scene-1>
      <div class="action-bar-demo-box"><MdActionBar :actions="double" /></div>
    </template>
    <template #scene-2>
      <div class="action-bar-demo-box">
        <MdActionBar :actions="double">
          <p style="font-size: 24px; color: #999">合计：<b style="color: #111">¥128.00</b></p>
        </MdActionBar>
      </div>
    </template>
    <template #scene-3>
      <div class="action-bar-demo-box"><MdActionBar :actions="disabled" /></div>
    </template>
  </DemoCanvas>
</template>
