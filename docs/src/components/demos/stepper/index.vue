<script setup lang="ts">
import { ref } from 'vue'
import { MdStepper } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '步长与范围', '禁用']
const v1 = ref(2)
const v2 = ref(1)
const v3 = ref(5)
const code = `<MdStepper v-model="v1" />
<MdStepper v-model="v2" :min="0" :max="10" :step="2" />
<MdStepper v-model="v3" disabled />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="sp-row">
        <MdStepper v-model="v1" />
      </div>
      <div class="sp-row sp-info">当前值：{{ v1 }}</div>
    </template>
    <template #scene-1>
      <div class="sp-row">
        <MdStepper v-model="v2" :min="0" :max="10" :step="2" />
      </div>
      <div class="sp-info">步长 2，范围 0 ~ 10，当前值：{{ v2 }}</div>
      <div class="sp-row">
        <MdStepper v-model="v3" :min="0" :max="5" :step="1" integer />
      </div>
    </template>
    <template #scene-2>
      <div class="sp-row">
        <MdStepper v-model="v1" disabled />
      </div>
      <div class="sp-row">
        <MdStepper v-model="v1" read-only />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.sp-row {
  padding: 12px 14px;
}
.sp-desc {
  padding: 0 14px;
  font-size: 12px;
  color: #999;
}
</style>