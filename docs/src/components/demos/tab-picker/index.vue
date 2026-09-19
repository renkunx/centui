<script setup lang="ts">
import { ref } from 'vue'
import { MdTabPicker, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['省市级联']
const code = `<MdTabPicker v-model="show" :data="data" @change="onChange" />`
const show = ref(false)
const result = ref('')
const data = {
  name: 'level1',
  label: '省份',
  options: [
    {
      value: 'zj',
      label: '浙江',
      children: {
        name: 'level2',
        label: '城市',
        options: [{ value: 'hz', label: '杭州' }, { value: 'nb', label: '宁波' }],
      },
    },
    { value: 'js', label: '江苏' },
  ],
}
function onChange(payload: { values: Array<string | number> }) {
  result.value = payload.values.join(' / ')
  show.value = false
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="tab-picker-demo">
        <MdButton type="primary" inline round @click="show = true">打开联动选择</MdButton>
        <p v-if="result" class="tab-picker-demo-result">{{ result }}</p>
        <MdTabPicker v-model="show" :data="data" title="请选择地区" @change="onChange" />
      </div>
    </template>
  </DemoCanvas>
</template>
