<script setup lang="ts">
import { CuTag } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['圆角', '半圆', '线框', '阳文', '特殊标签']
const code = `<CuTag size="small" shape="circle" type="fill" fill-color="#FC7353">特惠</CuTag>
<CuTag size="large" shape="fillet" type="fill" font-color="#FF5B60">逾期23天</CuTag>
<CuTag shape="coupon" fill-color="#FC9153">免息券70.1</CuTag>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
        <CuTag size="tiny" shape="circle" type="fill" fill-color="#FC7353" font-color="#000" />
        <CuTag size="small" shape="circle" type="fill" fill-color="#FC7353" font-color="#fff">特惠</CuTag>
        <CuTag size="large" shape="circle" type="fill" fill-color="#FC7353" font-color="#fff">返5000</CuTag>
        <CuTag size="small" shape="circle" type="ghost" font-color="#FC7353">特惠</CuTag>
        <CuTag size="small" shape="circle" sharp="bottom-left" type="fill" fill-color="linear-gradient(90deg, #FC7353 0%, #FC9153 100%)" font-color="#fff">续保3折起</CuTag>
      </div>
    </template>
    <template #scene-1>
      <div style="display: flex; gap: 12px; align-items: center">
        <CuTag size="large" shape="fillet" type="fill" fill-color="rgba(255, 91, 96, .1)" font-weight="normal" font-color="#FF5B60">逾期23天</CuTag>
        <CuTag size="large" shape="fillet" type="ghost" font-color="#FF5B60">逾期23天</CuTag>
      </div>
    </template>
    <template #scene-2>
      <div style="display: flex; gap: 12px; align-items: center">
        <CuTag size="large" shape="square" font-color="#FF8843" type="ghost">可选</CuTag>
        <CuTag size="small" shape="square" font-color="#28AA91" type="ghost">可选</CuTag>
      </div>
    </template>
    <template #scene-3>
      <div style="display: flex; gap: 12px; align-items: center">
        <CuTag size="large" shape="square" fill-color="rgba(0,0,0,0)" type="fill" font-weight="bolder" font-color="#333">￥3600</CuTag>
        <CuTag size="small" shape="square" fill-color="rgba(0,0,0,0)" type="fill" font-weight="bolder" font-color="#333">￥300</CuTag>
      </div>
    </template>
    <template #scene-4>
      <div style="display: flex; gap: 20px; align-items: center">
        <CuTag size="large" shape="coupon" fill-color="#FC9153" type="fill" font-color="#fff">免息券70.1</CuTag>
        <CuTag size="large" shape="quarter" fill-color="#FC9153" type="fill" font-color="#fff">免息券</CuTag>
      </div>
    </template>
  </DemoCanvas>
</template>
