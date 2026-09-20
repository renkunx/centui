<script setup lang="ts">
import { CuTip, CuButton } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['上方', '下方', '左侧', '右侧', '其他配置']
const code = `<CuTip content="不错哟" placement="top">
  <CuButton>点击我</CuButton>
</CuTip>
<CuTip icon="security" content="完善信息，领取5元免息券" fill>...</CuTip>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuTip content="不错哟" placement="top">
        <CuButton type="default">点击我</CuButton>
      </CuTip>
    </template>
    <template #scene-1>
      <CuTip content="不错哟" placement="bottom">
        <CuButton type="default">点击我</CuButton>
      </CuTip>
    </template>
    <template #scene-2>
      <CuTip content="不错哟" placement="left">
        <CuButton type="default">点击我</CuButton>
      </CuTip>
    </template>
    <template #scene-3>
      <CuTip content="不错哟" placement="right">
        <CuButton type="default">点击我</CuButton>
      </CuTip>
    </template>
    <template #scene-4>
      <CuTip icon="security" content="完善信息，领取5元免息券" fill>
        <CuButton type="default">点击我</CuButton>
      </CuTip>
    </template>
  </DemoCanvas>
</template>
