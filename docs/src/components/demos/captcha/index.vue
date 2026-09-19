<script setup lang="ts">
import { ref } from 'vue'
import { MdCaptcha } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['内联验证码']
const code = `<MdCaptcha is-view title="输入验证码" brief="验证码已发送至 138****1234" />
`
const submitted = ref('')
function onSubmit(code: string) {
  submitted.value = code
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="captcha-demo">
        <MdCaptcha
          is-view
          title="输入验证码"
          brief="验证码已发送至 138****1234"
          :maxlength="4"
          @submit="onSubmit"
        >
          短信验证码已发送
        </MdCaptcha>
        <p v-if="submitted" class="captcha-demo-result">已提交：{{ submitted }}</p>
      </div>
    </template>
  </DemoCanvas>
</template>
