<script setup lang="ts">
import { ref } from 'vue'
import { MdTransition } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['淡入淡出', '滑动', '弹跳']
const code = `<MdTransition name="md-fade">
  <div v-if="show">内容</div>
</MdTransition>`
const names = ['md-fade', 'md-slide-up', 'md-bounce']
const idx = ref(0)
const show = ref(true)
const scene = ref(0)

function toggle(i: number) {
  idx.value = i
  show.value = false
  setTimeout(() => {
    show.value = true
  }, 300)
}

function onSelect(i: number) {
  scene.value = i
  toggle(i)
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="transition-demo">
        <button class="transition-demo-btn" @click="toggle(0)">播放淡入淡出</button>
        <MdTransition name="md-fade">
          <div v-if="show && idx === 0" class="transition-demo-box">淡入淡出内容</div>
        </MdTransition>
      </div>
    </template>
    <template #scene-1>
      <div class="transition-demo">
        <button class="transition-demo-btn" @click="toggle(1)">播放上滑</button>
        <MdTransition name="md-slide-up">
          <div v-if="show && idx === 1" class="transition-demo-box">上滑内容</div>
        </MdTransition>
      </div>
    </template>
    <template #scene-2>
      <div class="transition-demo">
        <button class="transition-demo-btn" @click="toggle(2)">播放弹跳</button>
        <MdTransition name="md-bounce">
          <div v-if="show && idx === 2" class="transition-demo-box">弹跳内容</div>
        </MdTransition>
      </div>
    </template>
  </DemoCanvas>
</template>
