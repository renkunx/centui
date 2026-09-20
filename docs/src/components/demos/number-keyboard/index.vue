<script setup lang="ts">
import { ref } from 'vue'
import { CuNumberKeyboard, CuButton, CuIcon } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['有小数点', '无小数点', '简单类型', '乱序+确认', '插槽', '禁用']
const code = `<CuNumberKeyboard v-model="show" @enter="onEnter" @delete="onDelete" />
<CuNumberKeyboard v-model="show" hide-dot />
<CuNumberKeyboard v-model="show" type="simple" />
<CuNumberKeyboard v-model="show" ok-text="支付" disorder />
<CuNumberKeyboard v-model="show" disabled />`
const show1 = ref(false)
const show2 = ref(false)
const show3 = ref(false)
const show4 = ref(false)
const show5 = ref(false)
const show6 = ref(false)
const number = ref('')
function onNumberEnter(val: number | string) {
  number.value += String(val)
}
function onNumberDelete() {
  number.value = number.value.slice(0, -1)
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div style="width: 100%">
        <CuButton @click="show1 = !show1">{{ show1 ? '收起键盘' : '唤起键盘，有小数点' }}</CuButton>
        <CuNumberKeyboard v-model="show1" @enter="onNumberEnter" @delete="onNumberDelete" />
        <p v-if="number" style="font-size: 26px; padding: 12px">{{ number }}</p>
      </div>
    </template>
    <template #scene-1>
      <div style="width: 100%">
        <CuButton @click="show2 = !show2">{{ show2 ? '收起键盘' : '唤起键盘，无小数点' }}</CuButton>
        <CuNumberKeyboard v-model="show2" hide-dot @enter="onNumberEnter" @delete="onNumberDelete" />
      </div>
    </template>
    <template #scene-3>
      <div style="width: 100%">
        <CuButton @click="show3 = !show3">{{ show3 ? '收起键盘' : '简单类型' }}</CuButton>
        <CuNumberKeyboard v-model="show3" type="simple" @enter="onNumberEnter" @delete="onNumberDelete" />
        <p v-if="show3 && number" style="font-size: 26px; padding: 12px">{{ number }}</p>
      </div>
    </template>
    <template #scene-4>
      <div style="width: 100%">
        <CuButton @click="show4 = !show4">{{ show4 ? '收起键盘' : '乱序 + 确认支付' }}</CuButton>
        <CuNumberKeyboard v-model="show4" ok-text="支付" disorder @enter="onNumberEnter" @delete="onNumberDelete" />
      </div>
    </template>
    <template #scene-5>
      <div style="width: 100%">
        <CuButton @click="show5 = !show5">{{ show5 ? '收起键盘' : '插槽：安全支付' }}</CuButton>
        <CuNumberKeyboard v-model="show5" ok-text="支付" disorder>
          <p style="display: flex; align-items: center; justify-content: center; padding: 14px; font-size: 22px">
            <CuIcon name="security" />&nbsp;安全支付
          </p>
        </CuNumberKeyboard>
      </div>
    </template>
    <template #scene-6>
      <div style="width: 100%">
        <CuButton @click="show6 = !show6">{{ show6 ? '收起键盘' : '禁用键盘' }}</CuButton>
        <CuNumberKeyboard v-model="show6" disabled @enter="onNumberEnter" @delete="onNumberDelete" />
      </div>
    </template>
  </DemoCanvas>
</template>
