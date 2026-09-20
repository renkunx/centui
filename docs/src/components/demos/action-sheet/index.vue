<script setup lang="ts">
import { ref } from 'vue'
import { CuActionSheet, CuButton } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '带描述', '禁用项']
const show1 = ref(false)
const show2 = ref(false)
const show3 = ref(false)
const pick = ref('')
const options1 = [
  { text: '每日一更' },
  { text: '每周一更' },
  { text: '每月一更' },
]
const options2 = [
  { text: '分享', label: '分享给好友' },
  { text: '复制链接', label: '复制到剪贴板' },
]
const code = `<CuActionSheet v-model="show" title="更新频率" :options="options" @select="onSelect" />
<CuActionSheet v-model="show" title="分享" desc="选择分享方式" :options="options" />`
</script>

<template>
  <DemoCanvas mode="phone" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="btn-col">
        <CuButton type="primary" round @click="show1 = true">选择更新频率</CuButton>
      </div>
      <CuActionSheet v-model="show1" title="更新频率" :options="options1" @select="(o: any) => (pick = o.text)" />
      <div v-if="pick" class="picker-result">已选择：{{ pick }}</div>
    </template>
    <template #scene-1>
      <div class="btn-col">
        <CuButton type="primary" @click="show2 = true"> 分享到</CuButton>
      </div>
      <CuActionSheet v-model="show2" title="分享到" :options="options2" cancel-text="暂不分享" />
    </template>
    <template #scene-2>
      <div class="btn-col">
        <CuButton type="default" @click="show3 = true">带禁用项</CuButton>
      </div>
      <CuActionSheet v-model="show3" title="操作" :options="[{ text: '编辑' }, { text: '删除', disabled: true }]" cancel-text="取消" />
    </template>
  </DemoCanvas>
</template>

<style scoped>
.btn-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.picker-result {
  padding: 0 16px;
  font-size: 13px;
  color: #2f86f6;
}
</style>