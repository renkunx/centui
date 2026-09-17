<script setup lang="ts">
import { ref } from 'vue'
import { MdSwitch } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['开与关', '事件', '禁用']
const first = ref(true)
const second = ref(false)
const code = `<MdSwitch v-model="first" />
<MdSwitch v-model="second" @change="onChange" />
<MdSwitch disabled />
<MdSwitch disabled :model-value="true" />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="sw-row">
        <div class="sw-cell"><MdSwitch v-model="first" /><span>{{ first ? '已开启' : '已关闭' }}</span></div>
        <div class="sw-cell"><MdSwitch v-model="second" /><span>{{ second ? '已开启' : '已关闭' }}</span></div>
      </div>
    </template>
    <template #scene-1>
      <div class="sw-row">
        <MdSwitch @change="(v: boolean) => (window as any).__sw = v" />
        <span class="hint">切换后控制台无输出，试试在代码中监听 change</span>
      </div>
    </template>
    <template #scene-2>
      <div class="sw-row">
        <MdSwitch disabled />
        <MdSwitch disabled :model-value="true" />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.sw-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 12px;
}
.sw-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
}
.hint {
  font-size: 12px;
  color: #999;
}
</style>