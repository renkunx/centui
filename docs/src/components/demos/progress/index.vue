<script setup lang="ts">
import { ref } from 'vue'
import { MdProgress, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['圆环', '自定义', '动画']
const value = ref(60)
const colors = ['#2F86F6', '#35C454', '#FF9F0F', '#F5222D']
const color = ref(colors[0])
const code = `<MdProgress :value="60" />
<MdProgress :value="60" :color="color" />
<MdProgress :value="value" transition :duration="500" />`

function replay() {
  value.value = 0
  setTimeout(() => (value.value = Math.round(Math.random() * 100)), 60)
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="prog-row">
        <MdProgress :value="75" />
        <MdProgress :value="40" />
        <MdProgress :value="100" />
      </div>
    </template>
    <template #scene-1>
      <div class="prog-col">
        <MdProgress :value="60" :color="color" />
        <div class="dot-row">
          <span v-for="c in colors" :key="c" class="dot" :style="{ background: c }" @click="color = c" />
        </div>
      </div>
    </template>
    <template #scene-2>
      <div class="prog-row">
        <MdProgress :value="value" transition :duration="1000" />
      </div>
      <div class="play-row">
        <MdButton type="primary" size="small" @click="replay">重新播放</MdButton>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.prog-row {
  padding: 16px 12px;
}
.dot-row {
  display: flex;
  gap: 10px;
  padding: 0 12px;
}
.dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
}
.play-row {
  padding: 0 12px;
}
</style>