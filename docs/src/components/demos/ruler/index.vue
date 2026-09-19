<script setup lang="ts">
import { ref } from 'vue'
import { MdRuler } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础刻度', '自定义文案']
const code = `<MdRuler v-model="value" :scope="[0, 1000]" :step="100" :unit="25" />
<MdRuler v-model="value" :step-text-render="(v) => v + 'cm'" />`
const value = ref(500)
const value2 = ref(100)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="ruler-demo-box">
        <MdRuler v-model="value" :scope="[0, 1000]" :step="100" :unit="25" />
        <p class="ruler-demo-value">当前值：{{ value }}</p>
      </div>
    </template>
    <template #scene-1>
      <div class="ruler-demo-box">
        <MdRuler
          v-model="value2"
          :scope="[0, 200]"
          :step="50"
          :unit="10"
          :step-text-render="(v: number) => v + 'cm'"
        />
        <p class="ruler-demo-value">当前值：{{ value2 }}cm</p>
      </div>
    </template>
  </DemoCanvas>
</template>
