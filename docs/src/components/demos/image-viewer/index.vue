<script setup lang="ts">
import { ref } from 'vue'
import { MdImageViewer, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['图片查看']
const code = `<MdImageViewer v-model="show" :list="imgs" :initial-index="1" />`
const show = ref(false)
const imgs = [
  'https://img12.360buyimg.com/n1/jfs/t1/108640/22/11693/112095/5f077e78E834e5f16/12b5e15f4b0e7ed6.jpg',
  'https://img14.360buyimg.com/n1/jfs/t1/46036/33/4520/138517/5d38a75fEe33e2f2a/586d0d21bec5c83d.jpg',
]
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="viewer-demo">
        <MdButton type="primary" inline round @click="show = true">查看图片</MdButton>
        <MdImageViewer v-model="show" :list="imgs" :initial-index="0" />
      </div>
    </template>
  </DemoCanvas>
</template>
