<script setup lang="ts">
import { ref } from 'vue'
import { MdNumberKeyboard, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['弹出键盘', '隐藏小数点', 'view 内嵌']
const show = ref(false)
const show2 = ref(false)
const view = ref(true)
const typed = ref('')
function onEnter(v: string | number) {
  typed.value += String(v)
}
function onDelete() {
  typed.value = typed.value.slice(0, -1)
}
const code = `<MdNumberKeyboard v-model="show" :is-view="false" @enter="onEnter" @delete="onDelete" />
<MdNumberKeyboard v-model="show2" hide-dot />
<MdNumberKeyboard v-model="view" is-view />`
</script>

<template>
  <DemoCanvas mode="phone" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="nk-pad">
        <MdButton type="primary" round @click="show = true">输入金额</MdButton>
        <div class="nk-value">已输入：{{ typed || '（空）' }}</div>
      </div>
      <MdNumberKeyboard v-model="show" @enter="onEnter" @delete="onDelete" />
    </template>
    <template #scene-1>
      <div class="nk-pad">
        <MdButton type="warning" round @click="show2 = true">无小数点键盘</MdButton>
      </div>
      <MdNumberKeyboard v-model="show2" hide-dot :duplicate-zero="true" />
    </template>
    <template #scene-2>
      <div class="nk-pad">
        <div class="nk-note">view 模式下键盘常驻渲染，适合嵌入页面</div>
        <MdNumberKeyboard v-model="view" is-view />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.nk-pad {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.nk-value {
  font-size: 14px;
  color: #333;
}
.nk-note {
  font-size: 12px;
  color: #999;
}
</style>