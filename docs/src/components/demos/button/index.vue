<script setup lang="ts">
import { MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['默认', '主要', '禁用', '圆角', '朴素警告', '加载', '行内']
const code = `<MdButton type="primary" round>主要按钮</MdButton>
<MdButton type="warning" plain disabled>次要按钮</MdButton>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdButton type="default">默认按钮</MdButton>
    </template>
    <template #scene-1>
      <MdButton type="primary">主要按钮</MdButton>
    </template>
    <template #scene-2>
      <MdButton type="primary" disabled>主要按钮</MdButton>
      <MdButton type="default" disabled>默认按钮</MdButton>
    </template>
    <template #scene-3>
      <MdButton type="primary" round>主要按钮</MdButton>
    </template>
    <template #scene-4>
      <MdButton type="warning" plain>次要按钮</MdButton>
    </template>
    <template #scene-5>
      <MdButton type="primary" loading>加载中</MdButton>
      <MdButton type="default" loading>加载中</MdButton>
    </template>
    <template #scene-6>
      <MdButton type="primary" inline round>行内按钮</MdButton>
    </template>
  </DemoCanvas>
</template>