<template>
  <CuRolling
    class="cu-progress"
    :process="formatValue"
    :size="size"
    :width="width"
    :color="color"
    :border-color="borderColor"
    :fill="fill"
    :linecap="linecap"
    :rotate="rotate"
  >
    <slot></slot>
    <template #defs>
      <slot name="defs"></slot>
    </template>
  </CuRolling>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Animate } from '@centui/core/web'
import CuRolling from '../activity-indicator/Roller.vue'

defineOptions({ name: 'cu-progress' })

const props = withDefaults(
  defineProps<{
    size?: number
    width?: number
    color?: string
    borderColor?: string
    fill?: string
    linecap?: 'butt' | 'round' | 'square' | 'inherit'
    rotate?: number
    /** 进度控制 0-1 */
    value?: number
    transition?: boolean
    duration?: number
  }>(),
  {
    size: 70,
    width: undefined,
    color: '#2F86F6',
    borderColor: 'rgba(0, 0, 0, .1)',
    fill: 'transparent',
    linecap: 'round',
    rotate: 0,
    value: 0,
    transition: false,
    duration: 1000,
  },
)

const inBrowser = typeof window !== 'undefined'

const formatValue = ref(0)
const isMounted = ref(false)

watch(
  () => props.value,
  (val, oldVal) => {
    if ((!inBrowser && !isMounted.value) || !props.transition) {
      formatValue.value = val
      return
    }

    animateDisplay(oldVal, val)
  },
  { immediate: true },
)

onMounted(() => {
  isMounted.value = true
})

function animateDisplay(fromValue = 0, toValue = 0) {
  const step = (percent: number) => {
    formatValue.value = fromValue + (toValue - fromValue) * percent
  }

  const verify = () => true
  Animate.start(step, verify, () => {}, props.duration)
}
</script>
