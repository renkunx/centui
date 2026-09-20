<script setup lang="ts">
import { ref } from 'vue'
import { CuCheckBox, CuRadio } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['复选框', '单选框', '禁用']
const checked = ref(true)
const unchecked = ref(false)
const radioVal = ref('A')
const code = `<CuCheckBox v-model="checked" label="默认选中" />
<CuCheckBox v-model="unchecked" label="默认未选" />
<CuRadio v-model="radioVal" name="A" label="选项 A" />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="ck-row"><CuCheckBox v-model="checked" label="默认选中" /></div>
      <div class="ck-row"><CuCheckBox v-model="unchecked" label="默认未选" /></div>
    </template>
    <template #scene-1>
      <div class="ck-row"><CuRadio v-model="radioVal" name="A" label="选项 A" /></div>
      <div class="ck-row"><CuRadio v-model="radioVal" name="B" label="选项 B" /></div>
      <div class="ck-row ck-note">当前选中：{{ radioVal }}</div>
    </template>
    <template #scene-2>
      <div class="ck-row"><CuCheckBox v-model="unchecked" label="禁用未选" disabled /></div>
      <div class="ck-row"><CuCheckBox v-model="checked" label="禁用已选" disabled /></div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.ck-row {
  padding: 12px 14px;
  font-size: 14px;
  color: #333;
}
.ck-note {
  color: #999;
  font-size: 12px;
}
</style>