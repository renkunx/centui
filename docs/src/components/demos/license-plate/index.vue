<script setup lang="ts">
import { ref } from 'vue'
import { CuLicensePlate } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['车牌输入', '半弹层版']
const code = `<CuLicensePlate :default-value="defaultValue" @confirm="onConfirm" />`
const result = ref('')
function onConfirm(value: string) {
  result.value = value
}
</script>

<template>
  <DemoCanvas :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="license-plate-demo">
        <CuLicensePlate :default-value="'浙AD12345'" @confirm="onConfirm" />
        <p v-if="result" class="license-plate-demo-result">{{ result }}</p>
      </div>
    </template>
  </DemoCanvas>
</template>
