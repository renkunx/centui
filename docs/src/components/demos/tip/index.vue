<script setup lang="ts">
import { MdTip, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['上方', '下方', '左侧', '右侧', '其他配置']
const code = `<MdTip content="不错哟" placement="top">
  <MdButton>点击我</MdButton>
</MdTip>
<MdTip icon="security" content="完善信息，领取5元免息券" fill>...</MdTip>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdTip content="不错哟" placement="top">
        <MdButton type="default">点击我</MdButton>
      </MdTip>
    </template>
    <template #scene-1>
      <MdTip content="不错哟" placement="bottom">
        <MdButton type="default">点击我</MdButton>
      </MdTip>
    </template>
    <template #scene-2>
      <MdTip content="不错哟" placement="left">
        <MdButton type="default">点击我</MdButton>
      </MdTip>
    </template>
    <template #scene-3>
      <MdTip content="不错哟" placement="right">
        <MdButton type="default">点击我</MdButton>
      </MdTip>
    </template>
    <template #scene-4>
      <MdTip icon="security" content="完善信息，领取5元免息券" fill>
        <MdButton type="default">点击我</MdButton>
      </MdTip>
    </template>
  </DemoCanvas>
</template>
