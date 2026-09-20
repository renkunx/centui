<script setup lang="ts">
import { ref } from 'vue'
import { Toast, MdButton, MdToast, MdActivityIndicator } from 'mand-mobile'
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
      <MdButton @click="Toast.info('一段文字')">纯文字</MdButton>
    </template>
    <template #scene-1>
      <div style="display: flex; gap: 16px">
        <MdButton @click="Toast.succeed('操作成功')">成功</MdButton>
        <MdButton @click="Toast.failed('操作失败')">失败</MdButton>
      </div>
    </template>
    <template #scene-2>
      <MdButton @click="showLoading">载入</MdButton>
    </template>
    <template #scene-3>
      <MdButton @click="showLongText">长文字</MdButton>
    </template>
    <template #scene-4>
      <MdButton @click="Toast({ content: '自定义位置', position: 'bottom' })">自定义位置</MdButton>
    </template>
    <template #scene-5>
      <MdButton @click="showContinuous">连续调用</MdButton>
    </template>
    <template #scene-6>
      <div style="display: flex; flex-direction: column; gap: 16px; align-items: center">
        <MdToast ref="customToast" style="position: relative">
          <MdActivityIndicator :size="20" :text-size="16" color="yellow" text-color="white">loading...</MdActivityIndicator>
        </MdToast>
        <MdButton @click="customShow = !customShow">定制 Toast</MdButton>
        <MdButton @click="squareShow = !squareShow">方形 Toast</MdButton>
        <MdToast v-if="squareShow" icon="ring" icon-svg content="方形 Toast" square style="position: relative" />
      </div>
    </template>
  </DemoCanvas>
</template>
