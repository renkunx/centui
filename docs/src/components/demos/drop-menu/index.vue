<script setup lang="ts">
import { ref } from 'vue'
import { CuDropMenu } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础联动', '初始选中', '禁用项', '自定义菜单项']
const code = `<CuDropMenu :data="data" :default-value="defaultValue" @change="onChange" />`
const result = ref('')
const data0 = [
  { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }, { value: '3', text: '服饰' }] },
  { text: '排序', options: [{ value: '4', text: '默认排序' }, { value: '5', text: '价格' }] },
]
const data1 = [
  { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }] },
  { text: '排序', options: [{ value: '3', text: '默认排序' }, { value: '4', text: '价格' }] },
]
const data2 = [
  { text: '全部', options: [{ value: '1', text: '全部' }] },
  { text: '筛选', disabled: true, options: [{ value: '2', text: '价格' }] },
  { text: '排序', options: [{ value: '3', text: '默认' }, { value: '4', text: '评分', disabled: true }] },
]
const data3 = [
  { text: '自定义选项', options: [{ value: '1', text: '包含超长文本的选项内容演示' }, { value: '2', text: '短文本' }] },
]
function onChange(barItem: { text?: string }, listItem: { text?: string }) {
  result.value = `${barItem.text}: ${listItem.text}`
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuDropMenu :data="data0" :default-value="['2']" @change="onChange" />
    </template>
    <template #scene-1>
      <CuDropMenu :data="data1" :default-value="['2', '4']" @change="onChange" />
    </template>
    <template #scene-2>
      <CuDropMenu :data="data2" @change="onChange" />
    </template>
    <template #scene-3>
      <CuDropMenu :data="data3" @change="onChange" />
    </template>
  </DemoCanvas>
</template>
