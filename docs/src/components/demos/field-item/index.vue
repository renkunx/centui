<script setup lang="ts">
import { ref } from 'vue'
import { MdFieldItem, MdIcon, Toast } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '对齐与样式', '箭头与图标']
const code = `<MdFieldItem title="姓名" content="张三" arrow />
<MdFieldItem title="地址" placeholder="请输入地址" arrow />
<MdFieldItem title="手机号" arrow>13800138000</MdFieldItem>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="fi-list">
        <MdFieldItem title="姓名" content="张三" />
        <MdFieldItem title="手机号" placeholder="请输入手机号" />
        <MdFieldItem title="地址" content="北京市朝阳区望京 SOHO" arrow="1" />
      </div>
    </template>
    <template #scene-1>
      <div class="fi-list">
        <MdFieldItem title="金额" align-right solid>¥ 99.00</MdFieldItem>
        <MdFieldItem title="右上对齐" align-right>居右</MdFieldItem>
        <MdFieldItem title="禁用" disabled>不可编辑</MdFieldItem>
      </div>
    </template>
    <template #scene-2>
      <div class="fi-list">
        <MdFieldItem title="身份证" arrow="1">
          <template #left><MdIcon name="id-card" color="#2F86F6" /></template>
          110101********1234
          <template #right><MdIcon name="close" color="#ccc" @click="Toast.info('清空',  600)" /></template>
        </MdFieldItem>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.fi-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0;
  background: #fff;
}
</style>