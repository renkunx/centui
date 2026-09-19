<script setup lang="ts">
import { ref } from 'vue'
import { MdSelector, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['单选（即时）', '单选（确认）', '多选']
const code = `<MdSelector v-model="show" :data="data" @choose="onChoose" />
<MdSelector v-model="show" :data="data" ok-text="确定" @confirm="onConfirm" />
<MdSelector v-model="show" :data="data" multi ok-text="确定" @confirm="onConfirm" />`
const show1 = ref(false)
const show2 = ref(false)
const show3 = ref(false)
const data = [
  { value: '1', text: '选项一' },
  { value: '2', text: '选项二' },
  { value: '3', text: '选项三' },
]
const multiData = [
  { value: 'a', text: '选项 A' },
  { value: 'b', text: '选项 B' },
]
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="selector-demo">
        <MdButton type="primary" inline round @click="show1 = true">单选（即时）</MdButton>
        <MdSelector v-model="show1" :data="data" title="选择选项" />
      </div>
    </template>
    <template #scene-1>
      <div class="selector-demo">
        <MdButton type="primary" inline round @click="show2 = true">单选（确认）</MdButton>
        <MdSelector v-model="show2" :data="data" title="选择选项" ok-text="确定" cancel-text="取消" />
      </div>
    </template>
    <template #scene-2>
      <div class="selector-demo">
        <MdButton type="primary" inline round @click="show3 = true">多选</MdButton>
        <MdSelector v-model="show3" :data="multiData" multi title="多选" ok-text="确定" />
      </div>
    </template>
  </DemoCanvas>
</template>
