<script setup lang="ts">
import { ref } from 'vue'
import { CuCheck, CuCheckBox, CuCheckGroup, CuCheckList, CuField, CuButton, CuCellItem } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['复选项', '复选项组', '复选框', '复选框组', '复选列表', '图标左置']
const code = `<CuCheck v-model="checked" label="复选项" />
<CuCheckGroup v-model="favorites">
  <CuCheck name="apple" label="苹果" />
</CuCheckGroup>
<CuCheckBox name="month" v-model="pay" label="月付" />`
const checked = ref(false)
const favorites = ref(['apple'])
const pay = ref('')
const insurants = ref(['self', 'couple'])
const checkListFav = ref(['apple'])
const fruits = [
  { value: 'apple', text: '苹果' },
  { value: 'banana', text: '香蕉' },
  { value: 'orange', text: '橙子' },
]
function checkAll() {
  checkListFav.value = fruits.map(f => f.value)
}
function toggleAll() {
  checkListFav.value = checkListFav.value.length ? [] : fruits.map(f => f.value)
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <CuCheck v-model="checked" label="复选项" />
        <CuCheck label="禁用" disabled />
      </div>
    </template>
    <template #scene-1>
      <CuCheckGroup v-model="favorites">
        <CuCheck name="watermelon" label="西瓜" />
        <CuCheck name="apple" label="苹果" />
        <CuCheck name="banana" label="香蕉" />
        <CuCheck name="orange" label="橙子" />
        <CuCheck name="tomato" label="西红柿" disabled />
      </CuCheckGroup>
    </template>
    <template #scene-2>
      <div style="display: flex; gap: 24px">
        <CuCheckBox name="day" v-model="pay" label="日缴" disabled />
        <CuCheckBox name="month" v-model="pay" label="月付" />
        <CuCheckBox name="season" v-model="pay" label="季度费" />
      </div>
    </template>
    <template #scene-3>
      <CuCheckGroup v-model="insurants">
        <CuCheckBox icon-position="lt" name="self" disabled>自己</CuCheckBox>
        <CuCheckBox icon-position="rt" name="couple" disabled>配偶</CuCheckBox>
        <CuCheckBox icon-position="lt" name="parent">父母</CuCheckBox>
        <CuCheckBox icon-position="rt" name="child">子女</CuCheckBox>
      </CuCheckGroup>
    </template>
    <template #scene-4>
      <CuField title="复选列表">
        <CuCheckList v-model="checkListFav" icon="right" icon-inverse="" :options="fruits" />
        <CuCellItem no-border>
          <CuButton type="primary" size="small" inline @click="checkAll">全选</CuButton>
          <CuButton size="small" inline @click="toggleAll">反选</CuButton>
        </CuCellItem>
      </CuField>
    </template>
    <template #scene-5>
      <CuField title="复选列表">
        <CuCheckList v-model="checkListFav" icon-position="left" :options="fruits" />
      </CuField>
    </template>
  </DemoCanvas>
</template>
