<script setup lang="ts">
import { ref } from 'vue'
import { MdCashier, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['收银台']
const code = `<MdCashier v-model="show" :channels="channels" :payment-amount="'1000.00'" @pay="onPay" />`
const show = ref(false)
const channels = [
  { text: '招商银行储蓄卡', desc: '招商银行(1234)' },
  { text: '支付宝' },
]
function onPay() {
  show.value = false
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="cashier-demo">
        <MdButton type="primary" inline round @click="show = true">打开收银台</MdButton>
        <MdCashier v-model="show" :channels="channels" payment-amount="1000.00" title="支付" @pay="onPay" />
      </div>
    </template>
  </DemoCanvas>
</template>
