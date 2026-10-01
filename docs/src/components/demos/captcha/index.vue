<script setup lang="ts">
import { ref } from 'vue'
import { CuCaptcha, CuButton } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['内联', '半屏弹层', '对话框']
const code = `<CuCaptcha is-view title="输入验证码" brief="验证码已发送至 138****1234" />
<CuCaptcha v-model="showHalf" type="halfScreen" title="输入验证码" subtitle="用于核验信息有效性" />
<CuCaptcha v-model="showDialog" type="dialog" title="输入验证码" />`
const submitted = ref('')
const showHalf = ref(false)
const showDialog = ref(false)
function onSubmit(code: string) {
  submitted.value = code
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="captcha-demo">
        <CuCaptcha
          is-view
          title="输入验证码"
          brief="验证码已发送至 138****1234"
          :maxlength="4"
          @submit="onSubmit"
        >
          短信验证码已发送
        </CuCaptcha>
        <p v-if="submitted" class="captcha-demo-result">已提交：{{ submitted }}</p>
      </div>
    </template>
    <template #scene-1>
      <div class="captcha-demo">
        <CuButton type="primary" inline round @click="showHalf = true">打开半屏验证</CuButton>
        <CuCaptcha
          v-model="showHalf"
          type="halfScreen"
          title="输入验证码"
          subtitle="用于核验信息有效性及确定本人操作"
          brief="验证码已发送至 138****1234"
          :maxlength="4"
        >
          输入短信验证码 完成验证
        </CuCaptcha>
      </div>
    </template>
    <template #scene-2>
      <div class="captcha-demo">
        <CuButton type="primary" inline round @click="showDialog = true">打开对话框验证</CuButton>
        <CuCaptcha
          v-model="showDialog"
          type="dialog"
          title="输入验证码"
          brief="验证码已发送至 138****1234"
          :maxlength="4"
        >
          短信验证码已发送
        </CuCaptcha>
      </div>
    </template>
  </DemoCanvas>
</template>
