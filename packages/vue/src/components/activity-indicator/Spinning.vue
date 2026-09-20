<template>
  <div class="cu-activity-indicator-spinning" :class="{ dark: color === 'dark' }">
    <CuIcon
      class="cu-activity-indicator-svg"
      name="spinner"
      :style="{ width: `${size}px`, height: `${size}px` }"
    ></CuIcon>
  </div>
</template>

<script setup lang="ts">
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-activity-indicator-spinning' })

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
