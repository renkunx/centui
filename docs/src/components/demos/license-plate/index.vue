<script setup lang="ts">
import { ref } from 'vue'
import { MdLicensePlate } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['车牌输入']
const code = `<MdLicensePlate :default-value="defaultValue" @confirm="onConfirm" />`
const result = ref('')
function onConfirm(value: string) {
  result.value = value
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="license-plate-demo">
        <MdLicensePlate :default-value="'浙AD12345'" @confirm="onConfirm" />
        <p v-if="result" class="license-plate-demo-result">{{ result }}</p>
      </div>
    </template>
  </DemoCanvas>
</template>
