<script setup lang="ts">
import { ref } from 'vue'
import { CuInputItem, CuField, CuFieldItem, CuIcon } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['普通输入框', '业务场景', '大尺寸金融表单', '标题浮动', '错误提示', '表单控件']
const code = `<CuInputItem title="普通文本" placeholder="普通文本" />
<CuInputItem type="bankCard" title="银行卡" placeholder="xxx xxxx xxxx xxxx" />
<CuInputItem title="真实姓名" is-title-latent placeholder="投保人姓名" />`
const bankCardNo = ref('6222 0202 0202 0202 020')
const amount = ref('')
const phone = ref('13012345678')
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuField>
        <CuInputItem title="普通文本" placeholder="普通文本" />
        <CuInputItem title="禁用表单" value="禁用表单" disabled />
        <CuInputItem title="只读表单" value="只读表单" readonly />
      </CuField>
    </template>
    <template #scene-1>
      <CuField>
        <CuInputItem title="手机号" type="phone" v-model="phone" placeholder="phone xxx xxxx xxxx" />
        <CuInputItem title="储蓄卡号" type="bankCard" v-model="bankCardNo" clearable />
      </CuField>
    </template>
    <template #scene-2>
      <CuField title="转出金额(元)">
        <CuInputItem type="money" v-model="amount" brief="理财提示文案，字符超出10个自动变小" placeholder="最多30万元" is-amount />
      </CuField>
    </template>
    <template #scene-3>
      <CuField>
        <CuInputItem title="真实姓名" value="张**" is-title-latent placeholder="投保人姓名" />
        <CuInputItem title="身份证号" type="bankCard" value="3102**********" is-title-latent placeholder="投保人身份证号" />
      </CuField>
    </template>
    <template #scene-4>
      <CuField>
        <CuInputItem type="phone" title="手机号码" value="1999999999999" error="手机号码无效" clearable />
      </CuField>
    </template>
    <template #scene-5>
      <CuField title="表单控件">
        <template #action>
          <CuIcon name="info" />
        </template>
        <CuInputItem title="总余额" value="¥1000.00" readonly />
      </CuField>
    </template>
  </DemoCanvas>
</template>
