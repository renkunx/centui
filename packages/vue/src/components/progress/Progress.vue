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
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const formatValue = ref(0)
const isMounted = ref(false)
/** 进行中的 Animate 句柄：重入/卸载时 stop */
let animateId = 0

watch(
  () => props.value,
  (val, oldVal) => {
    // 首轮（setup 期）直接同步终值：SSR 与客户端首帧一致，后续变更才动画
    if (!isMounted.value || !props.transition) {
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

onBeforeUnmount(() => {
  if (animateId) {
    Animate.stop(animateId)
    animateId = 0
  }
})

function animateDisplay(fromValue = 0, toValue = 0) {
  if (animateId) {
    Animate.stop(animateId)
    animateId = 0
  }
  const step = (percent: number) => {
    formatValue.value = fromValue + (toValue - fromValue) * percent
  }

  const verify = () => true
  animateId = Animate.start(step, verify, () => {
    animateId = 0
  }, props.duration)
}
</script>
