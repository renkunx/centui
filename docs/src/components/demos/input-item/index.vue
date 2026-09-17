<script setup lang="ts">
import { ref } from 'vue'
import { MdInputItem } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '格式化', '校验']
const name = ref('')
const email = ref('')
const tel = ref('')
const bank = ref('')
const card = ref('')
const amount = ref('')
const pcode = ref('')
const code = `<MdInputItem title="手机号" v-model="tel" type="phone" clearable />
<MdInputItem title="银行卡" v-model="bank" type="bankCard" clearable />
<MdInputItem title="金额" v-model="amount" type="money" clearable />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="ii-list">
        <MdInputItem title="姓名" placeholder="请输入姓名" v-model="name" />
        <MdInputItem title="邮箱" placeholder="example@mail.com" v-model="email" />
        <MdInputItem title="验证码" placeholder="6 位数字" v-model="pcode" type="digit" />
        <MdInputItem title="备注" placeholder="选填" />
      </div>
    </template>
    <template #scene-1>
      <div class="ii-list">
        <MdInputItem title="手机号" v-model="tel" type="phone" placeholder="自动按 3-4-4 分组" clearable />
        <MdInputItem title="银行卡" v-model="bank" type="bankCard" placeholder="自动按 4 位分组" clearable />
        <MdInputItem title="金额" v-model="amount" type="money" placeholder="自动补两位小数" clearable />
      </div>
    </template>
    <template #scene-2>
      <div class="ii-list">
        <MdInputItem title="错误提示" error="两次输入的密码不一致" />
        <MdInputItem title="必填项" error="请输入必填内容" solid />
        <MdInputItem title="常规" v-model="tel" clearable />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.ii-list {
  background: #fff;
  padding: 4px 0;
}
</style>