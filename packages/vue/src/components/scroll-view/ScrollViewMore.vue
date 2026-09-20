<template>
  <div class="cu-scroll-view-more">
    <template v-if="!isFinished">
      {{ loadingText }}
    </template>
    <template v-else>
      {{ finishedText }}
    </template>
  </div>
</template>

<script setup lang="ts">
import { t } from '@centui/core'

defineOptions({ name: 'cu-scroll-view-more' })

withDefaults(
  defineProps<{
    loadingText?: string
    finishedText?: string
    isFinished?: boolean
  }>(),
  {
    loadingText: () => t('md.scroll_view.more.loading'),
    finishedText: () => t('md.scroll_view.more.allLoaded'),
    isFinished: false,
  },
)
</script>
