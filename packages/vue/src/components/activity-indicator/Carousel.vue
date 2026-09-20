<template>
  <div class="cu-activity-indicator-carousel">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="viewBox"
      :fill="color"
      :style="{ width: `${viewWidth}px`, height: `${size}px` }"
      class="cu-activity-indicator-svg carouseling"
    >
      <CuCarouselCircle
        v-for="(value, index) in circleAnimateValues"
        :key="`carousel-circle-${index}`"
        :size="size"
        :index="index"
        :animate-values="value"
      ></CuCarouselCircle>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CuCarouselCircle from './CarouselCircle.vue'

defineOptions({ name: 'cu-activity-indicator-carousel' })

const props = withDefaults(
  defineProps<{
    size?: number
    color?: string
  }>(),
  {
    size: 30,
    color: '#2F86F6',
  },
)

const circleAnimateValues: number[][] = [
  [1, 0.8, 0.6, 0.6, 0.6, 0.8, 1],
  [0.6, 0.8, 1, 0.8, 0.6, 0.6, 0.6],
  [0.6, 0.6, 0.6, 0.8, 1, 0.8, 0.6],
]

const viewWidth = computed(() => {
  const len = circleAnimateValues.length
  return len * props.size + ((len - 1) * props.size) / 2
})
const viewBox = computed(() => `0 0 ${viewWidth.value} ${props.size}`)
</script>
