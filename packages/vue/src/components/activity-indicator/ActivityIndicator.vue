<template>
  <div class="cu-activity-indicator" :class="type">
    <div class="indicator-container" :class="{ vertical }">
      <div class="indicator-loading">
        <template v-if="type === 'roller'">
          <CuRoller :size="size" :color="color" :width="width"></CuRoller>
        </template>
        <template v-else-if="type === 'spinner'">
          <CuSpinning :size="size" :color="color"></CuSpinning>
        </template>
        <template v-else-if="type === 'carousel'">
          <CuCarousel :size="size" :color="color"></CuCarousel>
        </template>
      </div>
      <div
        v-if="$slots.default"
        :style="{ fontSize: `${textSize}px`, color: textColor }"
        class="cu-activity-indicator-text indicator-text"
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CuRoller from './Roller.vue'
import CuSpinning from './Spinning.vue'
import CuCarousel from './Carousel.vue'

defineOptions({ name: 'cu-activity-indicator' })

const props = withDefaults(
  defineProps<{
    /** roller | spinner | carousel */
    type?: string
    size?: number
    width?: number
    color?: string
    textColor?: string
    textSize?: number
    vertical?: boolean
  }>(),
  {
    type: 'roller',
    size: 70,
    width: undefined,
    color: undefined,
    textColor: '#999',
    textSize: undefined,
    vertical: false,
  },
)

const color = computed(() => props.color ?? (props.type === 'spinner' ? 'dark' : '#2F86F6'))
</script>
