<template>
  <circle :cx="cx" :cy="size / 2" :r="size / 2">
    <animate
      attributeName="fill-opacity"
      attributeType="XML"
      begin="0s"
      dur="1s"
      :values="opacityValues"
      calcMode="linear"
      repeatCount="indefinite"
    />
    <animate
      attributeName="r"
      attributeType="XML"
      begin="0s"
      dur="1s"
      :values="sizeValues"
      calcMode="linear"
      repeatCount="indefinite"
    />
  </circle>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'md-activity-indicator-carousel-circle' })

const props = withDefaults(
  defineProps<{
    size?: number
    index?: number
    animateValues?: number[]
  }>(),
  {
    size: 30,
    index: 0,
    animateValues: () => [],
  },
)

const cx = computed(() => props.index * props.size * 1.5 + props.size / 2)
const opacityValues = computed(() => props.animateValues.join(';'))
const sizeValues = computed(() =>
  props.animateValues.map((val) => (val * props.size) / 2).join(';'),
)
</script>
