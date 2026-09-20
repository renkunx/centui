<script setup lang="ts">
import { ref } from 'vue'
import { CuRadio, CuRadioGroup, CuRadioList, CuField } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['普通单选项', '单选项组', '列表模式', '带输入项', '单选框']
const code = `<CuRadio name="0" v-model="checked" label="单选项1" />
<CuRadioGroup v-model="favorites">
  <CuRadio name="apple" label="苹果" />
</CuRadioGroup>
<CuRadioList v-model="myBank" :options="banks" />`
const checked = ref('0')
const favorites = ref('apple')
const myBank = ref('1')
const myReason = ref('')
const banks = [
  { value: '0', text: '中国农业银行' },
  { value: '1', text: '招商银行' },
  { value: '3', text: '其他' },
]
const reasons = [
  { value: '0', text: '不准确' },
  { value: '1', text: '不完整' },
  { value: '2', text: '其他' },
]
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <CuRadio name="0" v-model="checked" label="单选项1" />
        <CuRadio name="1" v-model="checked" label="单选项2" />
      </div>
    </template>
    <template #scene-1>
      <CuRadioGroup v-model="favorites">
        <CuRadio name="watermelon" label="西瓜" />
        <CuRadio name="apple" label="苹果" />
        <CuRadio name="banana" label="香蕉" />
        <CuRadio name="orange" label="橙子" />
        <CuRadio name="tomato" label="西红柿" disabled />
      </CuRadioGroup>
    </template>
    <template #scene-2>
      <CuField title="简单选择列表">
        <CuRadioList v-model="myBank" :options="banks" icon-size="lg" />
      </CuField>
    </template>
    <template #scene-3>
      <CuField title="输入项">
        <CuRadioList
          v-model="myReason"
          :options="reasons"
          icon="right"
          icon-inverse=""
          icon-disabled=""
          icon-position="right"
          has-input
          input-label="其他"
          input-placeholder="请输入原因"
        />
      </CuField>
    </template>
    <template #scene-4>
      <CuRadioGroup v-model="favorites">
        <CuRadioBox name="watermelon">西瓜</CuRadioBox>
        <CuRadioBox name="apple">苹果</CuRadioBox>
        <CuRadioBox name="banana" disabled>香蕉</CuRadioBox>
      </CuRadioGroup>
    </template>
  </DemoCanvas>
</template>
