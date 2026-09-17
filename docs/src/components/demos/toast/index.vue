<script setup lang="ts">
import { ref } from 'vue'
import { MdToast, MdButton, Toast } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['成功 / 失败 / 信息', '加载', '命令式']
const success = ref(false)
const failed = ref(false)
const info = ref(false)
const loading = ref(false)
const code = `<MdToast v-model="success" icon="success" content="操作成功" />
<MdToast v-model="failed" icon="fail" content="操作失败" />
<MdToast v-model="info" content="这是一条提示" />
<MdToast v-model="loading" icon="spinner" iconSvg :duration="0" content="加载中..." />`
</script>

<template>
  <DemoCanvas mode="phone" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="btn-col">
        <MdButton type="primary" @click="success = true">成功提示</MdButton>
        <MdButton type="warning" @click="failed = true">失败提示</MdButton>
        <MdButton @click="info = true">纯文本</MdButton>
      </div>
      <MdToast v-model="success" icon="success" content="操作成功" />
      <MdToast v-model="failed" icon="fail" content="操作失败，请重试" />
      <MdToast v-model="info" content="仅一条文字提示" />
    </template>
    <template #scene-1>
      <div class="btn-col">
        <MdButton type="primary" round @click="loading = true">显示加载</MdButton>
        <MdButton type="default" round @click="loading = false">隐藏加载</MdButton>
      </div>
      <MdToast v-model="loading" icon="spinner" icon-svg :duration="0" content="加载中..." />
    </template>
    <template #scene-2>
      <div class="btn-col">
        <MdButton type="primary" @click="Toast.succeed('保存成功', 2000)">成功命令</MdButton>
        <MdButton type="warning" @click="Toast.info('内容已复制', 2000)">信息命令</MdButton>
      </div>
      <div class="tip-note">命令式 Toast 基于 body 渲染，独立于手机壳</div>
    </template>
    <template #scene-3>
      <div class="btn-col">
        <MdButton type="primary" @click="Toast({ content: '顶部弹出', duration: 2000, position: 'top' })">顶部命令</MdButton>
        <MdButton type="default" @click="Toast({ content: '底部弹出', duration: 2000, position: 'bottom' })">底部命令</MdButton>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.btn-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.tip-note {
  padding: 0 16px;
  font-size: 12px;
  color: #999;
}
</style>