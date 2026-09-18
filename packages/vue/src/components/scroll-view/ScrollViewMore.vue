<template>
  <div class="md-scroll-view-more">
    <template v-if="!isFinished">
      {{ loadingText }}
    </template>
    <template v-else>
      {{ finishedText }}
    </template>
  </div>
</template>

<script setup lang="ts">
import { t } from '@mand-mobile/core'

defineOptions({ name: 'md-scroll-view-more' })

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
