<script setup lang="ts">
import { ref } from 'vue'
import { MdDropMenu } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础联动']
const code = `<MdDrop-menu :data="data" :default-value="['2']" @change="onChange" />`
const data = [
  { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }, { value: '3', text: '服饰' }] },
  { text: '排序', options: [{ value: '4', text: '默认排序' }, { value: '5', text: '价格' }] },
]
const result = ref('')
function onChange(barItem: { text?: string }, listItem: { text?: string }) {
  result.value = `${barItem.text}: ${listItem.text}`
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="drop-menu-demo">
        <MdDropMenu :data="data" :default-value="['2']" @change="onChange" />
        <p v-if="result" class="drop-menu-demo-result">{{ result }}</p>
        <p class="drop-menu-demo-tip">点击顶部栏展开选项</p>
      </div>
    </template>
  </DemoCanvas>
</template>
