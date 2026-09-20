<script setup lang="ts">
import { ref } from 'vue'
import { CuFieldItem, CuIcon, Toast } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '对齐与样式', '箭头与图标']
const code = `<CuFieldItem title="姓名" content="张三" arrow />
<CuFieldItem title="地址" placeholder="请输入地址" arrow />
<CuFieldItem title="手机号" arrow>13800138000</CuFieldItem>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="fi-list">
        <CuFieldItem title="姓名" content="张三" />
        <CuFieldItem title="手机号" placeholder="请输入手机号" />
        <CuFieldItem title="地址" content="北京市朝阳区望京 SOHO" arrow="1" />
      </div>
    </template>
    <template #scene-1>
      <div class="fi-list">
        <CuFieldItem title="金额" align-right solid>¥ 99.00</CuFieldItem>
        <CuFieldItem title="右上对齐" align-right>居右</CuFieldItem>
        <CuFieldItem title="禁用" disabled>不可编辑</CuFieldItem>
      </div>
    </template>
    <template #scene-2>
      <div class="fi-list">
        <CuFieldItem title="身份证" arrow="1">
          <template #left><CuIcon name="id-card" color="#2F86F6" /></template>
          110101********1234
          <template #right><CuIcon name="close" color="#ccc" @click="Toast.info('清空',  600)" /></template>
        </CuFieldItem>
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