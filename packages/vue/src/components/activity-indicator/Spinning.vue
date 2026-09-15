<template>
  <div class="md-activity-indicator-spinning" :class="{ dark: color === 'dark' }">
    <MdIcon
      class="md-activity-indicator-svg"
      name="spinner"
      :style="{ width: `${size}px`, height: `${size}px` }"
    ></MdIcon>
  </div>
</template>

<script setup lang="ts">
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-activity-indicator-spinning' })

withDefaults(
  defineProps<{
    size?: number
    color?: string
  }>(),
  {
    size: 70,
    color: 'dark',
  },
)
</script>
