<template>
  <div v-show="isViewerShow" class="md-image-viewer" @click="onViewerClick">
    <div class="viewer-container">
      <MdSwiper
        v-if="isViewerShow"
        ref="swiper"
        :autoplay="0"
        :default-index="currentImgIndex"
        :has-dots="false"
        :is-prevent="false"
        @after-change="afterChange"
      >
        <MdSwiperItem
          v-for="(item, index) in imgs"
          :key="index"
          class="viewer-item-wrap"
        >
          <div class="item">
            <img v-if="item.url" :src="item.url" :alt="item.alt" />
          </div>
        </MdSwiperItem>
      </MdSwiper>
      <div v-if="hasDots" class="viewer-index">{{ currentImgIndex + 1 }}/{{ list.length }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import MdSwiper from '../swiper/Swiper.vue'
import MdSwiperItem from '../swiper/SwiperItem.vue'

defineOptions({ name: 'md-image-viewer' })

export interface ImageViewerItem {
  url?: string
  alt?: string
  cls?: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    list?: Array<string | ImageViewerItem>
    initialIndex?: number
    hasDots?: boolean
  }>(),
  { modelValue: false, list: () => [], initialIndex: 0, hasDots: true },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', fromIndex: number, toIndex: number): void
}>()

const isViewerShow = ref(false)
const imgs = ref<Array<ImageViewerItem>>([])
const currentImgIndex = ref(0)

// v2 mounted：初始显隐；initialIndex 在挂载即打开时同样生效
isViewerShow.value = props.modelValue
if (isViewerShow.value) {
  currentImgIndex.value = props.initialIndex
  imgsInit()
}

watch(
  () => props.modelValue,
  (val) => {
    currentImgIndex.value = props.initialIndex
    isViewerShow.value = val
    nextTick(() => {
      imgsInit()
    })
  },
)
watch(isViewerShow, (val) => {
  emit('update:modelValue', val)
})

function imgsInit() {
  imgs.value = props.list.map(item => (typeof item === 'object' ? item : { url: item }))
}

function afterChange(fromIndex: number, toIndex: number) {
  currentImgIndex.value = toIndex
  emit('change', fromIndex, toIndex)
}

function onViewerClick() {
  isViewerShow.value = false
}
</script>
