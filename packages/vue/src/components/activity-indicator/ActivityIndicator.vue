<template>
  <div class="md-activity-indicator" :class="type">
    <div class="indicator-container" :class="{ vertical }">
      <div class="indicator-loading">
        <template v-if="type === 'roller'">
          <MdRoller :size="size" :color="color" :width="width"></MdRoller>
        </template>
        <template v-else-if="type === 'spinner'">
          <MdSpinning :size="size" :color="color"></MdSpinning>
        </template>
        <template v-else-if="type === 'carousel'">
          <MdCarousel :size="size" :color="color"></MdCarousel>
        </template>
      </div>
      <div
        v-if="$slots.default"
        :style="{ fontSize: `${textSize}px`, color: textColor }"
        class="md-activity-indicator-text indicator-text"
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MdRoller from './Roller.vue'
import MdSpinning from './Spinning.vue'
import MdCarousel from './Carousel.vue'

defineOptions({ name: 'md-activity-indicator' })

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
