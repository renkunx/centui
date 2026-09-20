<script setup lang="ts">
import { CuButton } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['默认', '主要', '禁用', '圆角', '朴素警告', '加载', '行内']
const code = `<CuButton type="primary" round>主要按钮</CuButton>
<CuButton type="warning" plain disabled>次要按钮</CuButton>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuButton type="default">默认按钮</CuButton>
    </template>
    <template #scene-1>
      <CuButton type="primary">主要按钮</CuButton>
    </template>
    <template #scene-2>
      <CuButton type="primary" disabled>主要按钮</CuButton>
      <CuButton type="default" disabled>默认按钮</CuButton>
    </template>
    <template #scene-3>
      <CuButton type="primary" round>主要按钮</CuButton>
    </template>
    <template #scene-4>
      <CuButton type="warning" plain>次要按钮</CuButton>
    </template>
    <template #scene-5>
      <CuButton type="primary" loading>加载中</CuButton>
      <CuButton type="default" loading>加载中</CuButton>
    </template>
    <template #scene-6>
      <CuButton type="primary" inline round>行内按钮</CuButton>
    </template>
  </DemoCanvas>
</template>