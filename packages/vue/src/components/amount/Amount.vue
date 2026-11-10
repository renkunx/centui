<template>
  <span class="cu-amount" :class="{ numerical: !isCapital }">
    <template v-if="!isCapital">{{ nonCapital }}</template>
    <template v-else>{{ capital }}</template>
  </span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  formatNumberWithSeparator,
  numberToChineseCapital,
  toFixedPrecision,
} from '@centui/core'
import { Animate } from '@centui/core/web'

defineOptions({ name: 'cu-amount' })

const props = withDefaults(
  defineProps<{
    value?: number
    precision?: number
    isRoundUp?: boolean
    hasSeparator?: boolean
    separator?: string
    isAnimated?: boolean
    /** v2 遗留别名，等价于 isAnimated 的过渡开关 */
    transition?: boolean
    isCapital?: boolean
    duration?: number
  }>(),
  {
    value: 0,
    precision: 2,
    isRoundUp: true,
    hasSeparator: false,
    separator: ',',
    isAnimated: false,
    transition: false,
    isCapital: false,
    duration: 1000,
  },
)

const displayValue = ref(0)
const isMounted = ref(false)
/** 进行中的 Animate 句柄：重入/卸载时 stop，避免多动画并行拉扯 displayValue */
let animateId = 0

const legalPrecision = computed(() => (props.precision > 0 ? props.precision : 0))

const nonCapital = computed(() => {
  const formatted = toFixedPrecision(displayValue.value, legalPrecision.value, props.isRoundUp)
  return props.hasSeparator ? formatNumberWithSeparator(formatted, props.separator) : formatted
})

const capital = computed(() =>
  numberToChineseCapital(toFixedPrecision(displayValue.value, 4, props.isRoundUp)),
)

watch(
  () => props.value,
  (val, oldVal) => {
    // 首轮（setup 期）直接同步终值：服务端与客户端首帧渲染一致（SSR 水合不闪变），
    // 后续变更才走动画
    if (!isMounted.value) {
      displayValue.value = val
      return
    }
    if (props.isAnimated || props.transition) {
      animateDisplay(oldVal, val)
    } else {
      displayValue.value = val
    }
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
    if (percent === 1) {
      displayValue.value = toValue
      return
    }
    displayValue.value = fromValue + (toValue - fromValue) * percent
  }
  const verify = () => true
  animateId = Animate.start(step, verify, () => {
    animateId = 0
  }, props.duration)
}
</script>
