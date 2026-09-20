<script setup lang="ts">
import { ref } from 'vue'
import { CuTextareaItem } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '可清除', '错误提示', '禁用']
const code = `<CuTextareaItem v-model="value" title="标题" placeholder="请输入" />
<CuTextareaItem v-model="value" title="标题" clearable />
<CuTextareaItem v-model="value" title="标题" error="错误提示" />`
const basic = ref('')
const clearable = ref('可清除内容')
const error = ref('内容')
const disabled = ref('禁用内容')
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuTextareaItem v-model="basic" title="标题" placeholder="请输入简介" />
    </template>
    <template #scene-1>
      <CuTextareaItem v-model="clearable" title="标题" clearable />
    </template>
    <template #scene-2>
      <CuTextareaItem v-model="error" title="标题" error="内容不能为空" />
    </template>
    <template #scene-3>
      <CuTextareaItem v-model="disabled" title="标题" disabled />
    </template>
  </DemoCanvas>
</template>
