<template>
  <div class="cu-activity-indicator-rolling">
    <div class="rolling-container">
      <svg
        :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`"
        :style="{ width: `${size}px`, height: `${size}px`, transform: `rotateZ(${rotate}deg)` }"
        preserveAspectRatio="xMidYMid"
        class="cu-activity-indicator-svg rolling"
      >
        <circle
          fill="none"
          :stroke="borderColor"
          :stroke-width="strokeWidth"
          :cx="viewBoxSize / 2"
          :cy="viewBoxSize / 2"
          :r="radius"
        />
        <g v-if="!$slots.circle" class="circle">
          <circle
            v-if="isAutoAnimation || (process ?? 0) > 0"
            class="stroke"
            :cx="viewBoxSize / 2"
            :cy="viewBoxSize / 2"
            :fill="fill"
            :stroke="color"
            :stroke-width="strokeWidth"
            :stroke-dasharray="
              isAutoAnimation ? `${(110 * circlePerimeter) / 125}` : strokeDasharray
            "
            :stroke-linecap="linecap"
            :r="radius"
          >
            <animate
              v-if="isAutoAnimation"
              attributeName="stroke-dashoffset"
              :values="`${(360 * circlePerimeter) / 125};${(140 * circlePerimeter) / 125}`"
              dur="2.2s"
              keyTimes="0;1"
              calcMode="spline"
              fill="freeze"
              keySplines="0.41,0.314,0.8,0.54"
              repeatCount="indefinite"
              begin="0"
            />
            <animateTransform
              v-if="isAutoAnimation"
              :dur="`${duration}s`"
              :values="`0 ${viewBoxSize / 2} ${viewBoxSize / 2};360 ${viewBoxSize / 2} ${viewBoxSize / 2}`"
              attributeName="transform"
              type="rotate"
              calcMode="linear"
              keyTimes="0;1"
              begin="0"
              repeatCount="indefinite"
            ></animateTransform>
          </circle>
        </g>
        <slot v-else name="circle"></slot>
        <slot name="defs"></slot>
      </svg>
      <div class="content"><slot></slot></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'cu-activity-indicator-rolling' })

const props = withDefaults(
  defineProps<{
    size?: number
    width?: number
    color?: string
    borderColor?: string
    fill?: string
    linecap?: 'butt' | 'round' | 'square' | 'inherit'
    rotate?: number
    /** 进度控制 0-1；不传时为自动不定态动画 */
    process?: number
  }>(),
  {
    size: 70,
    width: undefined,
    color: '#2F86F6',
    borderColor: 'rgba(0, 0, 0, .1)',
    fill: 'transparent',
    linecap: 'round',
    rotate: 0,
    process: undefined,
  },
)

const strokeWidth = computed(() => props.width || props.size / 12)
const radius = computed(() => props.size / 2)
const viewBoxSize = computed(() => props.size + 2 * strokeWidth.value)
const circlePerimeter = computed(() => props.size * 3.1415)
const duration = 2
const isAutoAnimation = computed(() => props.process === undefined)
const strokeDasharray = computed(
  () => `${props.process! * circlePerimeter.value} ${(1 - props.process!) * circlePerimeter.value}`,
)
</script>
