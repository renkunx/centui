<template>
  <div class="md-swiper-item" :style="{ width: swiperWidth, height: swiperHeight }">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, inject, onBeforeUnmount, onMounted, type ComponentPublicInstance } from 'vue'

defineOptions({ name: 'md-swiper-item' })

export interface SwiperItemProps {
  /** loop 拷贝实例（不注册回 Swiper） */
  isCopy?: boolean
}

export interface SwiperContextValue {
  dimension: () => number
  isVertical: () => boolean
  register: (item: ComponentPublicInstance) => void
  unregister: (item: ComponentPublicInstance) => void
}

const props = withDefaults(defineProps<SwiperItemProps>(), { isCopy: false })

const swiper = inject<SwiperContextValue | null>('mdSwiper', null)

const swiperWidth = computed(() =>
  !swiper || swiper.isVertical() ? 'auto' : `${swiper.dimension()}px`,
)
const swiperHeight = computed(() =>
  !swiper || !swiper.isVertical() ? 'auto' : `${swiper.dimension()}px`,
)

const instance = getCurrentInstance()?.proxy

onMounted(() => {
  // loop 拷贝实例不注册（否则 Swiper 的 item 计数会随拷贝无限增长）
  if (props.isCopy) {
    return
  }
  if (swiper && instance) {
    swiper.register(instance)
  }
})

onBeforeUnmount(() => {
  if (props.isCopy) {
    return
  }
  if (swiper && instance) {
    swiper.unregister(instance)
  }
})
</script>
