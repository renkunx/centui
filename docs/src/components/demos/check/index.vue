<script setup lang="ts">
import { ref } from 'vue'
import { MdCheck, MdCheckBox } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['Check', 'CheckBox', '禁用']
const a = ref(true)
const b = ref(false)
const c = ref(false)
const d = ref(true)
const code = `<MdCheck v-model="a" label="同意协议" />
<MdCheckBox v-model="b" label="银行卡支付" />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="ck-row"><MdCheck v-model="a" label="同意协议并阅读" /></div>
      <div class="ck-row"><MdCheck v-model="b" label="默认未选中" /></div>
    </template>
    <template #scene-1>
      <div class="ck-row"><MdCheckBox v-model="c" label="勾选即订阅" icon-position="lt" /></div>
      <div class="ck-row"><MdCheckBox v-model="d" label="已开启" /></div>
    </template>
    <template #scene-2>
      <div class="ck-row"><MdCheck v-model="b" label="禁用未选" disabled /></div>
      <div class="ck-row"><MdCheck v-model="a" label="禁用已选" disabled /></div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.ck-row {
  padding: 12px 14px;
  font-size: 14px;
  color: #333;
}
</style>