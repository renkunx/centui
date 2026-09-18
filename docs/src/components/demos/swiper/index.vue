<script setup lang="ts">
import { MdSwiper, MdSwiperItem } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['自动轮播', '手动滑动', '竖向滑动', '淡入淡出', '无指示器']
const code = `<MdSwiper :autoplay="3000">
  <MdSwiperItem>轮播 1</MdSwiperItem>
  <MdSwiperItem>轮播 2</MdSwiperItem>
  <MdSwiperItem>轮播 3</MdSwiperItem>
</MdSwiper>
<MdSwiper transition="slideY" :autoplay="3000">...</MdSwiper>
<MdSwiper transition="fade" :autoplay="3000">...</MdSwiper>`
const colors = ['#5C6B77', '#2F86F6', '#FF7A45']
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdSwiper class="swiper-demo-box" :autoplay="3000">
        <MdSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">轮播 {{ i + 1 }}</div>
        </MdSwiperItem>
      </MdSwiper>
    </template>
    <template #scene-1>
      <MdSwiper class="swiper-demo-box" :autoplay="0">
        <MdSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">拖我试试 {{ i + 1 }}</div>
        </MdSwiperItem>
      </MdSwiper>
    </template>
    <template #scene-2>
      <MdSwiper class="swiper-demo-box" transition="slideY" :autoplay="3000">
        <MdSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">竖向 {{ i + 1 }}</div>
        </MdSwiperItem>
      </MdSwiper>
    </template>
    <template #scene-3>
      <MdSwiper class="swiper-demo-box" transition="fade" :autoplay="3000">
        <MdSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">淡入淡出 {{ i + 1 }}</div>
        </MdSwiperItem>
      </MdSwiper>
    </template>
    <template #scene-4>
      <MdSwiper class="swiper-demo-box" :autoplay="3000" :has-dots="false">
        <MdSwiperItem v-for="(c, i) in colors" :key="i">
          <div class="swiper-demo-item" :style="{ background: c }">无指示器 {{ i + 1 }}</div>
        </MdSwiperItem>
      </MdSwiper>
    </template>
  </DemoCanvas>
</template>
