<script setup lang="ts">
import { ref } from 'vue'
import { MdCodebox } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['系统键盘', '掩码遮蔽', '不限长度', '系统键盘不限长度']
const code = `<MdCodebox v-model="code" :maxlength="4" autofocus />
<MdCodebox v-model="code" :maxlength="6" :mask="true" />
<MdCodebox v-model="code" :maxlength="-1" system />`
const code1 = ref('')
const code2 = ref('')
const code3 = ref('')
const code4 = ref('')
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdCodebox v-model="code1" :maxlength="4" :autofocus="false" />
    </template>
    <template #scene-1>
      <MdCodebox v-model="code2" :maxlength="6" :mask="true" />
    </template>
    <template #scene-2>
      <MdCodebox v-model="code3" :maxlength="-1" />
    </template>
    <template #scene-3>
      <MdCodebox v-model="code4" :maxlength="-1" system />
    </template>
  </DemoCanvas>
</template>
