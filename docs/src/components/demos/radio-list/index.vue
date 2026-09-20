<script setup lang="ts">
import { ref } from 'vue'
import { CuRadioList } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '带自定义', '禁用']
const value = ref('1')
const value2 = ref('b')
const value3 = ref('2')
const options = [
  { value: '1', text: '按件计费' },
  { value: '2', text: '按重量计费' },
  { value: '3', text: '到付', disabled: true },
]
const options2 = [
  { value: 'a', text: '顺丰', brief: '次日达' },
  { value: 'b', text: '圆通', brief: '3-5 天' },
  { value: 'c', text: '邮政', brief: '较慢，偏远可送达' },
]
const code = `<CuRadioList :options="options" v-model="value" />
<CuRadioList :options="options2" v-model="value2" has-input input-label="自定义" />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuRadioList :options="options" v-model="value" />
      <div class="rd-note">当前选择：{{ value }}</div>
    </template>
    <template #scene-1>
      <CuRadioList :options="options2" v-model="value2" />
    </template>
    <template #scene-2>
      <CuRadioList :options="options" v-model="value3" disabled />
    </template>
  </DemoCanvas>
</template>

<style scoped>
.rd-note {
  padding: 8px 14px;
  font-size: 12px;
  color: #999;
}
</style>