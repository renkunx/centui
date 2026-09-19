<script setup lang="ts">
import { MdBill, MdFieldItem, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础账单', '自定义头部']
const code = `<MdBill title="借款电子凭证" no="12345689" water-mark="mand-mobile">
  <MdFieldItem title="借款金额" content="¥30,000" />
</MdBill>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdBill title="借款电子凭证" no="12345689" water-mark="mand-mobile">
        <MdFieldItem title="借款金额" content="¥30,000" />
        <MdFieldItem title="收款账户" content="张三" />
        <MdFieldItem title="借款期限" content="12 个月" />
      </MdBill>
    </template>
    <template #scene-1>
      <MdBill>
        <template #header>
          <div class="bill-demo-header">自定义头部区域</div>
        </template>
        <p class="bill-demo-text">账单内容</p>
        <template #footer>
          <MdButton type="primary" inline round>刷新</MdButton>
        </template>
      </MdBill>
    </template>
  </DemoCanvas>
</template>
