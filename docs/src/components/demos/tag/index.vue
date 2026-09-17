<script setup lang="ts">
import { MdTag } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['填充', '幽灵', '圆角', '自定义颜色']
const code = `<MdTag type="fill">特惠</MdTag>
<MdTag type="ghost">满减券</MdTag>
<MdTag shape="fillet">新品</MdTag>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="tag-row">
        <MdTag type="fill">特惠</MdTag>
        <MdTag type="fill" sharp="orange">满减券</MdTag>
        <MdTag type="fill" sharp="red">新品</MdTag>
        <MdTag type="fill" sharp="blue">限时</MdTag>
      </div>
    </template>
    <template #scene-1>
      <div class="tag-row">
        <MdTag type="ghost">默认</MdTag>
        <MdTag type="ghost" sharp="orange">可领取</MdTag>
        <MdTag type="ghost" sharp="red">已抢光</MdTag>
      </div>
    </template>
    <template #scene-2>
      <div class="tag-row">
        <MdTag shape="fillet">圆角</MdTag>
        <MdTag shape="fillet" sharp="orange" size="lg">大号圆角</MdTag>
        <MdTag shape="square">方角</MdTag>
      </div>
    </template>
    <template #scene-3>
      <div class="tag-row">
        <MdTag fill-color="#35C454" font-color="#fff" type="fill">自定义绿色</MdTag>
        <MdTag fill-color="#FFE9A8" font-color="#8C5A00" type="fill">自定义浅黄</MdTag>
        <MdTag font-color="#8A35C7" type="ghost">自定义描边</MdTag>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 12px;
}
</style>