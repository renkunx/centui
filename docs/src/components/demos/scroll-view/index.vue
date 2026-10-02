<script setup lang="ts">
import { ref } from 'vue'
import { CuScrollView, CuScrollViewRefresh, CuScrollViewMore, CuButton } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['下拉刷新 + 加载更多', '横向滚动', '手动初始化', '加载更多（触底）']
const code = `<CuScrollView
  ref="scrollView"
  :auto-reflow="true"
  @end-reached="loadMore"
  @refreshing="refresh"
>
  <template #refresh="{ scrollTop }">
    <CuScrollViewRefresh :scroll-top="scrollTop" />
  </template>
  <div v-for="i in items" :key="i" class="scroll-demo-item">{{ i }}</div>
  <template #more="{ isEndReaching }">
    <CuScrollViewMore :is-finished="isEndReaching" />
  </template>
</CuScrollView>`

const scrollView = ref()
const manualView = ref()
const items = ref<number[]>(Array.from({ length: 15 }, (_, i) => i + 1))
const isFinished = ref(false)
const endItems = ref<number[]>(Array.from({ length: 10 }, (_, i) => i + 1))
const endFinished = ref(false)

function manualInit() {
  manualView.value?.init()
}

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

function loadMoreEnd() {
  if (endFinished.value) {
    return
  }
  setTimeout(() => {
    const next = endItems.value.length + 5
    if (next > 30) {
      endFinished.value = true
    } else {
      endItems.value = Array.from({ length: next }, (_, i) => i + 1)
    }
  }, 800)
}
</script>

<template>
  <DemoCanvas :scenes="scenes" :code="code">
    <template #scene-0>
      <CuScrollView
        ref="scrollView"
        class="scroll-demo-box"
        :auto-reflow="true"
        @end-reached="loadMore"
        @refreshing="refresh"
      >
        <template #refresh="{ scrollTop }">
          <CuScrollViewRefresh :scroll-top="scrollTop" />
        </template>
        <div v-for="i in items" :key="i" class="scroll-demo-item">{{ i }}</div>
        <template #more="{ isEndReaching }">
          <CuScrollViewMore :is-finished="isEndReaching" />
        </template>
      </CuScrollView>
    </template>
    <template #scene-1>
      <CuScrollView
        class="scroll-demo-box--short"
        :scrolling-y="false"
        :auto-reflow="true"
      >
        <div class="scroll-demo-horizon">
          <div v-for="i in 10" :key="i" class="scroll-demo-card">{{ i }}</div>
        </div>
      </CuScrollView>
    </template>
    <template #scene-2>
      <div class="scroll-pad">
        <CuButton size="small" inline @click="manualInit">手动初始化滚动区域</CuButton>
        <CuScrollView ref="manualView" manual-init class="scroll-demo-box--manual">
          <div v-for="i in 20" :key="i" class="scroll-demo-item">{{ i }}</div>
        </CuScrollView>
      </div>
    </template>
    <template #scene-3>
      <CuScrollView
        class="scroll-demo-box"
        :immediate-check-end-reaching="true"
        :end-reached-threshold="60"
        @end-reached="loadMoreEnd"
      >
        <div v-for="i in endItems" :key="i" class="scroll-demo-item">{{ i }}</div>
        <template #more="{ isEndReaching }">
          <CuScrollViewMore :is-finished="isEndReaching" />
        </template>
      </CuScrollView>
    </template>
  </DemoCanvas>
</template>
