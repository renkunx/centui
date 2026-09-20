<script setup lang="ts">
import { ref } from 'vue'
import { CuTabBar } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['两标签', '首屏五个', '滚动', '无下划线', '监听事件']
const code = `<CuTabBar v-model="current" :items="items" />
<CuTabBar v-model="current" :items="items" :max-length="5" />
<CuTabBar v-model="current" :items="items" :has-ink="false" />`
const current1 = ref(1)
const current2 = ref(1)
const current3 = ref(1)
const current4 = ref(1)
const current5 = ref(1)
const two = [{ name: 1, label: '标签1' }, { name: 2, label: '标签2' }]
const five = Array.from({ length: 5 }, (_, i) => ({ name: i + 1, label: `标签${i + 1}` }))
const scroll = [
  { name: 1, label: '精选' },
  { name: 2, label: '全部' },
  { name: 3, label: '满减券' },
  { name: 4, label: '立减券' },
  { name: 5, label: '免息券' },
  { name: 6, label: '团购' },
]
const onChanged = ref('')
function onTabChange(item: { label?: string }) {
  onChanged.value = `切换到 ${item.label}`
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuTabBar v-model="current1" :items="two" />
    </template>
    <template #scene-1>
      <CuTabBar v-model="current2" :items="five" :max-length="5" />
    </template>
    <template #scene-2>
      <CuTabBar v-model="current3" :items="scroll" :max-length="5" />
    </template>
    <template #scene-3>
      <CuTabBar v-model="current4" :items="two" :has-ink="false" />
    </template>
    <template #scene-4>
      <div style="width: 100%">
        <CuTabBar v-model="current5" :items="scroll" :max-length="5" @change="onTabChange" />
        <p v-if="onChanged" style="font-size: 24px; color: #2f86f6; padding: 16px">{{ onChanged }}</p>
      </div>
    </template>
  </DemoCanvas>
</template>
