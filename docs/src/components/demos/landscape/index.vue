<script setup lang="ts">
import { ref } from 'vue'
import { CuLandscape, CuButton } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['弹层横屏', '全屏横屏']
const code = `<CuLandscape v-model="show">
  <img src="..." />
</CuLandscape>
<CuLandscape v-model="show" full-screen />`
const show1 = ref(false)
const show2 = ref(false)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="landscape-demo">
        <CuButton type="primary" inline round @click="show1 = true">打开横屏弹层</CuButton>
        <CuLandscape v-model="show1">
          <img
            class="landscape-demo-img"
            src="https://img12.360buyimg.com/n1/jfs/t1/108640/22/11693/112095/5f077e78E834e5f16/12b5e15f4b0e7ed6.jpg"
          />
        </CuLandscape>
      </div>
    </template>
    <template #scene-1>
      <div class="landscape-demo">
        <CuButton type="primary" inline round @click="show2 = true">打开全屏横屏</CuButton>
        <CuLandscape v-model="show2" full-screen>
          <p class="landscape-demo-text">全屏横屏内容</p>
        </CuLandscape>
      </div>
    </template>
  </DemoCanvas>
</template>
