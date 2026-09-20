<script setup lang="ts">
import { ref } from 'vue'
import { MdRadio, MdRadioGroup, MdRadioList, MdField } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['普通单选项', '单选项组', '列表模式', '带输入项', '单选框']
const code = `<MdRadio name="0" v-model="checked" label="单选项1" />
<MdRadioGroup v-model="favorites">
  <MdRadio name="apple" label="苹果" />
</MdRadioGroup>
<MdRadioList v-model="myBank" :options="banks" />`
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
        <MdRadio name="0" v-model="checked" label="单选项1" />
        <MdRadio name="1" v-model="checked" label="单选项2" />
      </div>
    </template>
    <template #scene-1>
      <MdRadioGroup v-model="favorites">
        <MdRadio name="watermelon" label="西瓜" />
        <MdRadio name="apple" label="苹果" />
        <MdRadio name="banana" label="香蕉" />
        <MdRadio name="orange" label="橙子" />
        <MdRadio name="tomato" label="西红柿" disabled />
      </MdRadioGroup>
    </template>
    <template #scene-2>
      <MdField title="简单选择列表">
        <MdRadioList v-model="myBank" :options="banks" icon-size="lg" />
      </MdField>
    </template>
    <template #scene-3>
      <MdField title="输入项">
        <MdRadioList
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
      </MdField>
    </template>
    <template #scene-4>
      <MdRadioGroup v-model="favorites">
        <MdRadioBox name="watermelon">西瓜</MdRadioBox>
        <MdRadioBox name="apple">苹果</MdRadioBox>
        <MdRadioBox name="banana" disabled>香蕉</MdRadioBox>
      </MdRadioGroup>
    </template>
  </DemoCanvas>
</template>
