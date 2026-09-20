<script setup lang="ts">
import { ref } from 'vue'
import { CuPopup, CuButton } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['居中弹层', '底部弹层', '无遮罩']
const center = ref(false)
const bottom = ref(false)
const plain = ref(false)
const code = `<CuPopup v-model="center" position="center">
  <div class="demo-box">居中内容</div>
</CuPopup>
<CuPopup v-model="bottom" position="bottom">
  <div class="demo-box">底部内容</div>
</CuPopup>`
</script>

<template>
  <DemoCanvas mode="phone" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="ctr-pad">
        <CuButton type="primary" round @click="center = true">打开居中弹层</CuButton>
      </div>
      <CuPopup v-model="center" position="center">
        <div style="padding: 24px 40px; border-radius: 10px; text-align: center; background: #fff">
          <div style="margin-bottom: 8px">居中弹层内容</div>
          <CuButton size="small" @click="center = false">关闭</CuButton>
        </div>
      </CuPopup>
    </template>
    <template #scene-1>
      <div class="phone-pad">
        <CuButton type="primary" round @click="bottom = true">打开底部弹层</CuButton>
      </div>
      <CuPopup v-model="bottom" position="bottom">
        <div class="sheet">
          <div class="sheet-title">底部弹层</div>
          <div class="sheet-content">内容区域</div>
          <CuButton type="primary" round block @click="bottom = false">知道了</CuButton>
        </div>
      </CuPopup>
    </template>
    <template #scene-2>
      <div class="phone-pad">
        <CuButton type="default" round @click="plain = true">无遮罩弹层</CuButton>
      </div>
      <CuPopup v-model="plain" position="bottom" :has-mask="false">
        <div class="sheet">
          <div class="sheet-title">无遮罩，点击背景不关闭</div>
          <CuButton type="default" round block @click="plain = false">关闭</CuButton>
        </div>
      </CuPopup>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.phone-pad {
  padding: 12px;
  display: flex;
  justify-content: center;
}
.sheet {
  padding: 16px 16px 24px;
  background: #fff;
  border-radius: 12px 12px 0 0;
  text-align: center;
}
.sheet-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}
.sheet-content {
  padding: 20px 0;
  color: #999;
  font-size: 13px;
}
</style>