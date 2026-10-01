<script setup lang="ts">
import { ref } from 'vue'
import { CuSwiper, CuSwiperItem } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['自动轮播', '手动滑动', '竖向滑动', '淡入淡出', '无指示器', '每屏多内容']
const code = `<CuSwiper :autoplay="3000">
  <CuSwiperItem>轮播 1</CuSwiperItem>
  <CuSwiperItem>轮播 2</CuSwiperItem>
  <CuSwiperItem>轮播 3</CuSwiperItem>
</CuSwiper>
<CuSwiper transition="slideY" :autoplay="3000">...</CuSwiper>
<CuSwiper transition="fade" :autoplay="3000">...</CuSwiper>`
const colors = ['#5C6B77', '#2F86F6', '#FF7A45']
const swiperRef = ref<{ goto: (i: number) => void } | null>(null)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuSwiper class="swiper-demo-box" :autoplay="3000">
        <CuSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">轮播 {{ i + 1 }}</div>
        </CuSwiperItem>
      </CuSwiper>
    </template>
    <template #scene-1>
      <CuSwiper class="swiper-demo-box" :autoplay="0">
        <CuSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">拖我试试 {{ i + 1 }}</div>
        </CuSwiperItem>
      </CuSwiper>
    </template>
    <template #scene-2>
      <CuSwiper class="swiper-demo-box" transition="slideY" :autoplay="3000">
        <CuSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">竖向 {{ i + 1 }}</div>
        </CuSwiperItem>
      </CuSwiper>
    </template>
    <template #scene-3>
      <CuSwiper class="swiper-demo-box" transition="fade" :autoplay="3000">
        <CuSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">淡入淡出 {{ i + 1 }}</div>
        </CuSwiperItem>
      </CuSwiper>
    </template>
    <template #scene-4>
      <CuSwiper class="swiper-demo-box" :autoplay="3000" :has-dots="false">
        <CuSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">无指示器 {{ i + 1 }}</div>
        </CuSwiperItem>
      </CuSwiper>
    </template>
    <template #scene-5>
      <div style="width: 100%">
        <CuSwiper ref="swiperRef" class="swiper-demo-box" :autoplay="0">
          <CuSwiperItem v-for="p in 2" :key="p">
            <div class="swiper-demo-multi">
              <div v-for="c in 4" :key="c" class="swiper-demo-cell">{{ (p - 1) * 4 + c }}</div>
            </div>
          </CuSwiperItem>
        </CuSwiper>
        <div style="display: flex; gap: 12px; justify-content: center; padding: 16px">
          <CuButton size="small" inline @click="swiperRef?.goto(1)">goto 2</CuButton>
          <CuButton size="small" inline @click="swiperRef?.goto(0)">goto 1</CuButton>
        </div>
      </div>
    </template>
  </DemoCanvas>
</template>
