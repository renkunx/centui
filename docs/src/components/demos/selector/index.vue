<script setup lang="ts">
import { ref } from 'vue'
import { CuSelector, CuButton } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['无需确认', '确认模式', 'Check 模式', '多选模式', '自定义选项']
const code = `<CuSelector v-model="show" :data="data" @choose="onChoose" />
<CuSelector v-model="show" :data="data" ok-text="确定" @confirm="onConfirm" />
<CuSelector v-model="show" :data="data" multi ok-text="确定" @confirm="onConfirm" />`
const data = [
  { value: '1', text: '选项一', brief: '选项一描述' },
  { value: '2', text: '选项二', brief: '选项二描述' },
  { value: '3', text: '选项三', brief: '选项三描述' },
]
const showA = ref(false)
const showB = ref(false)
const showC = ref(false)
const showD = ref(false)
const showE = ref(false)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuButton @click="showA = true">无需确认</CuButton>
      <CuSelector v-model="showA" :data="data" title="无需确认" />
    </template>
    <template #scene-1>
      <CuButton @click="showB = true">确认模式</CuButton>
      <CuSelector v-model="showB" :data="data" title="确认模式" ok-text="确定" cancel-text="取消" />
    </template>
    <template #scene-2>
      <CuButton @click="showC = true">Check 模式</CuButton>
      <CuSelector v-model="showC" :data="data" title="Check 模式" is-check />
    </template>
    <template #scene-3>
      <CuButton @click="showD = true">多选模式</CuButton>
      <CuSelector v-model="showD" :data="data" multi title="多选模式" ok-text="确定" />
    </template>
    <template #scene-4>
      <CuButton @click="showE = true">自定义选项</CuButton>
      <CuSelector v-model="showE" :data="data" title="自定义选项">
        <template #default="{ option, selected }">
          <div style="display: flex; justify-content: space-between; padding: 0 8px">
            <span>{{ option.text }}</span>
            <span style="color: #2f86f6" v-if="selected">已选</span>
          </div>
        </template>
      </CuSelector>
    </template>
  </DemoCanvas>
</template>
