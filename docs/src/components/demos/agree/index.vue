<script setup lang="ts">
import { ref } from 'vue'
import { CuAgree } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['未选中', '选中', '选中不可用', '未选中不可用', '方形选中', '方形未选中']
const code = `<CuAgree v-model="checked">本人承诺投保人已充分了解本保险产品</CuAgree>
<CuAgree v-model="checked" icon-type="square">...</CuAgree>`
const text = '本人承诺投保人已充分了解本保险产品，并保证投保信息的真实性，理解并同意'
const textLink = text + '<a>《投保须知》</a>, <a>《保险条款》</a>'
const c0 = ref(false)
const c1 = ref(true)
const c2 = ref(true)
const c3 = ref(false)
const c4 = ref(true)
const c5 = ref(false)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuAgree v-model="c0">{{ text }}</CuAgree>
    </template>
    <template #scene-1>
      <CuAgree v-model="c1" v-html="textLink" />
    </template>
    <template #scene-2>
      <CuAgree v-model="c2" disabled>{{ text }}</CuAgree>
    </template>
    <template #scene-3>
      <CuAgree v-model="c3" disabled>{{ text }}</CuAgree>
    </template>
    <template #scene-4>
      <CuAgree v-model="c4" icon-type="square" v-html="textLink" />
    </template>
    <template #scene-5>
      <CuAgree v-model="c5" icon-type="square">{{ text }}</CuAgree>
    </template>
  </DemoCanvas>
</template>
