<template>
  <span class="md-amount" :class="{ numerical: !isCapital }">
    <template v-if="!isCapital">{{ nonCapital }}</template>
    <template v-else>{{ capital }}</template>
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  formatNumberWithSeparator,
  numberToChineseCapital,
  toFixedPrecision,
} from '@mand-mobile/core'
import { Animate } from '@mand-mobile/core/web'

defineOptions({ name: 'md-amount' })

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

const inBrowser = typeof window !== 'undefined'

const displayValue = ref(0)
const isMounted = ref(false)

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
    if (!inBrowser && !isMounted.value) {
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

function animateDisplay(fromValue = 0, toValue = 0) {
  const step = (percent: number) => {
    if (percent === 1) {
      displayValue.value = toValue
      return
    }
    displayValue.value = fromValue + (toValue - fromValue) * percent
  }
  const verify = () => true
  Animate.start(step, verify, () => {}, props.duration)
}
</script>
