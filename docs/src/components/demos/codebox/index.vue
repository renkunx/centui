<script setup lang="ts">
import { ref } from 'vue'
import { CuCodebox } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['系统键盘', '掩码遮蔽', '不限长度', '系统键盘不限长度']
const code = `<CuCodebox v-model="code" :maxlength="4" autofocus />
<CuCodebox v-model="code" :maxlength="6" :mask="true" />
<CuCodebox v-model="code" :maxlength="-1" system />`
const code1 = ref('')
const code2 = ref('')
const code3 = ref('')
const code4 = ref('')
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuCodebox v-model="code1" :maxlength="4" :autofocus="false" />
    </template>
    <template #scene-1>
      <CuCodebox v-model="code2" :maxlength="6" :mask="true" />
    </template>
    <template #scene-2>
      <CuCodebox v-model="code3" :maxlength="-1" />
    </template>
    <template #scene-3>
      <CuCodebox v-model="code4" :maxlength="-1" system />
    </template>
  </DemoCanvas>
</template>
