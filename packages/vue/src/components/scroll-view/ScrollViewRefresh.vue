<template>
  <div ref="el" class="md-scroll-view-refresh">
    <MdActivityIndicatorRolling :process="!isRefreshing ? process : undefined" :width="10" :color="rollerColor"></MdActivityIndicatorRolling>
    <p class="refresh-tip">{{ refreshTip }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { t } from '@mand-mobile/core'
import MdActivityIndicatorRolling from '../activity-indicator/Roller.vue'

defineOptions({ name: 'md-scroll-view-refresh' })

const props = withDefaults(
  defineProps<{
    scrollTop?: number
    isRefreshing?: boolean
    isRefreshActive?: boolean
    refreshText?: string
    refreshActiveText?: string
    refreshingText?: string
    rollerColor?: string
  }>(),
  {
    scrollTop: 0,
    isRefreshing: false,
    isRefreshActive: false,
    refreshText: undefined,
    refreshActiveText: undefined,
    refreshingText: undefined,
    rollerColor: '#2F86F6',
  },
)

const el = ref<HTMLElement>()

const process = computed(() => {
  // 0 高度（未测量/不可见）与 v2 pre-mount 求值等价：保持原始进度，避免除零产生 Infinity
  if (!el.value || el.value.clientHeight <= 0 || !props.scrollTop) {
    return +props.scrollTop
  }
  const refreshHeight = el.value.clientHeight
  if (Math.abs(props.scrollTop) < refreshHeight / 2) {
    return 0
  }
  // first 1/3 is not included in progress
  return (Math.abs(props.scrollTop) - refreshHeight / 2) / (refreshHeight / 2)
})

const refreshTip = computed(() => {
  if (props.isRefreshing) {
    return props.refreshingText ?? t('md.scroll_view.refresh.refreshing')
  } else if (props.isRefreshActive) {
    return props.refreshActiveText ?? t('md.scroll_view.refresh.freedRefresh')
  }
  return props.refreshText ?? t('md.scroll_view.refresh.pullDownRefresh')
})
</script>
