<script setup lang="ts">
import { ref } from 'vue'
import { MdCheck, MdCheckBox, MdCheckGroup, MdCheckList, MdField, MdButton, MdCellItem } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['复选项', '复选项组', '复选框', '复选框组', '复选列表', '图标左置']
const code = `<MdCheck v-model="checked" label="复选项" />
<MdCheckGroup v-model="favorites">
  <MdCheck name="apple" label="苹果" />
</MdCheckGroup>
<MdCheckBox name="month" v-model="pay" label="月付" />`
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
        <MdCheck v-model="checked" label="复选项" />
        <MdCheck label="禁用" disabled />
      </div>
    </template>
    <template #scene-1>
      <MdCheckGroup v-model="favorites">
        <MdCheck name="watermelon" label="西瓜" />
        <MdCheck name="apple" label="苹果" />
        <MdCheck name="banana" label="香蕉" />
        <MdCheck name="orange" label="橙子" />
        <MdCheck name="tomato" label="西红柿" disabled />
      </MdCheckGroup>
    </template>
    <template #scene-2>
      <div style="display: flex; gap: 24px">
        <MdCheckBox name="day" v-model="pay" label="日缴" disabled />
        <MdCheckBox name="month" v-model="pay" label="月付" />
        <MdCheckBox name="season" v-model="pay" label="季度费" />
      </div>
    </template>
    <template #scene-3>
      <MdCheckGroup v-model="insurants">
        <MdCheckBox icon-position="lt" name="self" disabled>自己</MdCheckBox>
        <MdCheckBox icon-position="rt" name="couple" disabled>配偶</MdCheckBox>
        <MdCheckBox icon-position="lt" name="parent">父母</MdCheckBox>
        <MdCheckBox icon-position="rt" name="child">子女</MdCheckBox>
      </MdCheckGroup>
    </template>
    <template #scene-4>
      <MdField title="复选列表">
        <MdCheckList v-model="checkListFav" icon="right" icon-inverse="" :options="fruits" />
        <MdCellItem no-border>
          <MdButton type="primary" size="small" inline @click="checkAll">全选</MdButton>
          <MdButton size="small" inline @click="toggleAll">反选</MdButton>
        </MdCellItem>
      </MdField>
    </template>
    <template #scene-5>
      <MdField title="复选列表">
        <MdCheckList v-model="checkListFav" icon-position="left" :options="fruits" />
      </MdField>
    </template>
  </DemoCanvas>
</template>
