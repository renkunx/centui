<script setup lang="ts">
import { ref } from 'vue'
import { MdDialog, MdButton, type DialogBtn } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '竖排布局', '带图标']
const show1 = ref(false)
const show2 = ref(false)
const show3 = ref(false)
const btnClose: DialogBtn = { text: '取消', handler: () => (show1.value = false) }
const btnOk: DialogBtn = { text: '确定', warning: true, handler: () => (show1.value = false) }
const btnClose2: DialogBtn = { text: '取消', handler: () => (show2.value = false) }
const btnOk2: DialogBtn = { text: '确定', handler: () => (show2.value = false) }
const btnOk3: DialogBtn = { text: '知道了', handler: () => (show3.value = false) }
const code = `<MdDialog v-model="show" title="温馨提示" content="是否确认删除该条记录？" :btns="btns" />
<MdDialog v-model="show" title="删除确认" content="删除后将无法恢复" layout="column" :btns="btns" />`
</script>

<template>
  <DemoCanvas mode="phone" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="btn-col">
        <MdButton type="primary" @click="show1 = true">传统对话</MdButton>
        <MdButton type="warning" @click="show3 = true">单按钮</MdButton>
      </div>
      <MdDialog v-model="show1" title="确认操作" content="确定要删除该条记录吗？此操作不可恢复" :btns="[btnClose, btnOk]" />
      <MdDialog v-model="show3" title="提示" content="内容更新成功" :btns="[btnOk3]" />
    </template>
    <template #scene-1>
      <div class="btn-col">
        <MdButton type="primary" @click="show2 = true">竖排布局</MdButton>
      </div>
      <MdDialog v-model="show2" title="删除确认" content="删除后将无法恢复，是否继续？" layout="column" :btns="[btnOk2, btnClose2]" />
    </template>
    <template #scene-2>
      <div class="btn-col">
        <MdButton type="primary" @click="show3 = true">带图标的对话框</MdButton>
      </div>
      <MdDialog v-model="show3" icon="success-color" icon-svg title="支付成功" content="您的订单已完成支付" :btns="[btnOk3]" />
    </template>
  </DemoCanvas>
</template>

<style scoped>
.btn-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
</style>