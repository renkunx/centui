<script setup lang="ts">
import { ref } from 'vue'
import { Toast, CuButton, CuToast, CuActivityIndicator } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['纯文字', '成功/失败', '载入', '长文字', '位置', '连续调用', '定制/方形']
const code = `Toast.info('一段文字')
Toast.succeed('操作成功')
Toast.loading('加载中...')
Toast({ content: '自定义位置', position: 'bottom' })`
const customShow = ref(false)
const squareShow = ref(false)

function showLongText() {
  Toast.succeed('所有文案部分字数最多展示15个字')
}
function showLoading() {
  Toast.loading('加载中...')
  setTimeout(() => Toast.hide(), 2000)
}
function showContinuous() {
  Toast.loading('加载中...')
  setTimeout(() => {
    Toast.succeed('加载完成')
  }, 1500)
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuButton @click="Toast.info('一段文字')">纯文字</CuButton>
    </template>
    <template #scene-1>
      <div style="display: flex; gap: 16px">
        <CuButton @click="Toast.succeed('操作成功')">成功</CuButton>
        <CuButton @click="Toast.failed('操作失败')">失败</CuButton>
      </div>
    </template>
    <template #scene-2>
      <CuButton @click="showLoading">载入</CuButton>
    </template>
    <template #scene-3>
      <CuButton @click="showLongText">长文字</CuButton>
    </template>
    <template #scene-4>
      <CuButton @click="Toast({ content: '自定义位置', position: 'bottom' })">自定义位置</CuButton>
    </template>
    <template #scene-5>
      <CuButton @click="showContinuous">连续调用</CuButton>
    </template>
    <template #scene-6>
      <div style="display: flex; flex-direction: column; gap: 16px; align-items: center">
        <CuToast ref="customToast" style="position: relative">
          <CuActivityIndicator :size="20" :text-size="16" color="yellow" text-color="white">loading...</CuActivityIndicator>
        </CuToast>
        <CuButton @click="customShow = !customShow">定制 Toast</CuButton>
        <CuButton @click="squareShow = !squareShow">方形 Toast</CuButton>
        <CuToast v-if="squareShow" icon="ring" icon-svg content="方形 Toast" square style="position: relative" />
      </div>
    </template>
  </DemoCanvas>
</template>
