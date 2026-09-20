<script setup lang="ts">
import { CuBill, CuFieldItem, CuButton } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础账单', '自定义头部']
const code = `<CuBill title="借款电子凭证" no="12345689" water-mark="centui">
  <CuFieldItem title="借款金额" content="¥30,000" />
</CuBill>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuBill title="借款电子凭证" no="12345689" water-mark="centui">
        <CuFieldItem title="借款金额" content="¥30,000" />
        <CuFieldItem title="收款账户" content="张三" />
        <CuFieldItem title="借款期限" content="12 个月" />
      </CuBill>
    </template>
    <template #scene-1>
      <CuBill>
        <template #header>
          <div class="bill-demo-header">自定义头部区域</div>
        </template>
        <p class="bill-demo-text">账单内容</p>
        <template #footer>
          <CuButton type="primary" inline round>刷新</CuButton>
        </template>
      </CuBill>
    </template>
  </DemoCanvas>
</template>
