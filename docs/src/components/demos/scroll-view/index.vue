<script setup lang="ts">
import { ref } from 'vue'
import { MdScrollView, MdScrollViewRefresh, MdScrollViewMore } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['下拉刷新 + 加载更多', '横向滚动']
const code = `<MdScrollView
  ref="scrollView"
  :auto-reflow="true"
  @end-reached="loadMore"
  @refreshing="refresh"
>
  <template #refresh="{ scrollTop }">
    <MdScrollViewRefresh :scroll-top="scrollTop" />
  </template>
  <div v-for="i in items" :key="i" class="scroll-demo-item">{{ i }}</div>
  <template #more="{ isEndReaching }">
    <MdScrollViewMore :is-finished="isEndReaching" />
  </template>
</MdScrollView>`

const scrollView = ref()
const items = ref<number[]>(Array.from({ length: 15 }, (_, i) => i + 1))
const isFinished = ref(false)

function refresh() {
  setTimeout(() => {
    items.value = Array.from({ length: 15 }, (_, i) => i + 1)
    isFinished.value = false
    scrollView.value?.finishRefresh()
  }, 1200)
}

function loadMore() {
  if (isFinished.value) {
    return
  }
  setTimeout(() => {
    const next = items.value.length + 5
    if (next > 40) {
      isFinished.value = true
    } else {
      items.value = Array.from({ length: next }, (_, i) => i + 1)
    }
    scrollView.value?.finishLoadMore()
  }, 1000)
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdScrollView
        ref="scrollView"
        class="scroll-demo-box"
        :auto-reflow="true"
        @end-reached="loadMore"
        @refreshing="refresh"
      >
        <template #refresh="{ scrollTop }">
          <MdScrollViewRefresh :scroll-top="scrollTop" />
        </template>
        <div v-for="i in items" :key="i" class="scroll-demo-item">{{ i }}</div>
        <template #more="{ isEndReaching }">
          <MdScrollViewMore :is-finished="isEndReaching" />
        </template>
      </MdScrollView>
    </template>
    <template #scene-1>
      <MdScrollView
        class="scroll-demo-box--short"
        :scrolling-y="false"
        :auto-reflow="true"
      >
        <div class="scroll-demo-horizon">
          <div v-for="i in 10" :key="i" class="scroll-demo-card">{{ i }}</div>
        </div>
      </MdScrollView>
    </template>
  </DemoCanvas>
</template>
