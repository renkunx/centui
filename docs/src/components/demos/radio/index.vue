<script setup lang="ts">
import { ref } from 'vue'
import { MdRadio } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '行内', '禁用']
const value = ref('A')
const code = `<MdRadio v-model="value" name="A" label="选项 A" />
<MdRadio v-model="value" name="B" label="选项 B" />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="rd-row">
        <MdRadio v-model="value" name="A" label="选项 A" />
        <MdRadio v-model="value" name="B" label="选项 B" />
        <MdRadio v-model="value" name="C" label="选项 C" />
      </div>
      <div class="rd-note">当前选中：{{ value }}</div>
    </template>
    <template #scene-1>
      <div class="rd-row">
        <MdRadio v-model="value" name="A" label="A" inline />
        <MdRadio v-model="value" name="B" label="B" inline />
        <MdRadio v-model="value" name="C" label="C" inline />
      </div>
    </template>
    <template #scene-2>
      <div class="rd-row">
        <MdRadio v-model="value" name="A" label="禁用未选" disabled />
        <MdRadio v-model="value" name="B" label="正常可点" />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.rd-row {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  font-size: 14px;
  color: #333;
}
.rd-note {
  padding: 0 14px;
  font-size: 12px;
  color: #999;
}
</style>