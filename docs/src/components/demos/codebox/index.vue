<script setup lang="ts">
import { ref } from 'vue'
import { MdCodebox, MdButton, Toast } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['输入验证码', '掩码显示', '禁用与错误']
const code = ref('')
const masked = ref('1234')
const disabled = ref('')
const error = ref('99')
function onSubmit(v: string) {
  Toast.succeed(`验证码 ${v} 已提交`, 1500)
}
function onSubmit2(v: string) {
  if (v !== '1234') {
    Toast.failed('验证码不正确', 1000)
    return
  }
  Toast.succeed('验证通过', 1000)
}
const src = `<MdCodebox v-model="code" @submit="onSubmit" />
<MdCodebox v-model="masked" mask />
<MdCodebox disabled />`
</script>

<template>
  <DemoCanvas mode="phone" :scenes="scenes" :code="src">
    <template #scene-0>
<div class="cd-pad">
        <div class="cd-label">请输入短信验证码</div>
        <MdCodebox v-model="code" @submit="onSubmit" />
        <div class="cd-note">演示已收到的 4 位短信验证码 <b>1234</b></div>
      </div>
    </template>
    <template #scene-1>
      <div class="cd-pad">
        <div class="cd-label">掩码输入</div>
        <MdCodebox v-model="masked" mask />
        <div class="cd-note">当前值：{{ masked || '（空）' }}</div>
      </div>
    </template>
    <template #scene-2>
      <div class="cd-pad">
        <div class="cd-label">禁用</div>
        <MdCodebox v-model="disabled" disabled />
        <div class="cd-label" style="margin-top: 18px">错误样式</div>
        <MdCodebox v-model="error" is-error-style />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.cd-pad {
  padding: 20px 16px;
}
.cd-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}
.cd-note {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}
</style>