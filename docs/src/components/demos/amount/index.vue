<script setup lang="ts">
import { ref } from 'vue'
import { MdAmount, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础金额', '千分位', '大写金额', '动画切换']
const value = ref(123456.789)
const code = `<MdAmount :value="123456.789" />
<MdAmount :value="123456.789" has-separator />
<MdAmount :value="123456.789" is-capital />
<MdAmount :value="value" is-animated transition />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="demo-pad">
        <MdAmount :value="1234.5" />
        <MdAmount :value="0.99" />
        <MdAmount :value="-1234.5" />
        <MdAmount :value="86400000" precision="0" />
      </div>
    </template>
    <template #scene-1>
      <div class="nums-pad">
        <MdAmount :value="123456789.125" has-separator />
        <MdAmount :value="123456789.125" has-separator precision="0" />
        <MdAmount :value="123456789" has-separator precision="0" />
      </div>
    </template>
    <template #scene-2>
      <div class="nums-pad">
        <MdAmount :value="123456.78" is-capital />
        <MdAmount :value="0.01" is-capital />
      </div>
    </template>
    <template #scene-3>
      <div class="nums-pad">
        <MdAmount :value="value" is-animated transition :duration="800" />
        <div class="btn-line">
          <MdButton type="primary" size="small" @click="value = Math.round(Math.random() * 1000000) / 100">随机金额</MdButton>
        </div>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.nums-pad {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.btn-line {
  margin-top: 8px;
}
</style>