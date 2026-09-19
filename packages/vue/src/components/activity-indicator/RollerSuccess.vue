<template>
  <div class="md-activity-indicator-rolling-success">
    <MdRoller :size="size" :width="strokeWidth" fill="#FFF6F1" border-color="transparent">
      <template v-if="isSuccess">
        <g name="circle" slot="circle">
          <circle class="success" cx="50" cy="50" fill="#FFF6F1" stroke="none" r="40"></circle>
        </g>
      </template>
      <svg
        v-if="isSuccess"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
        class="right"
        :style="{ transform: `translate(-50%, -50%) scale(${size / 70})` }"
      >
        <g>
          <line
            x1="32"
            y1="47"
            x2="45"
            y2="62"
            :style="{ strokeWidth: strokeWidth, stroke: color }"
            stroke-dasharray="20"
          />
          <line
            x1="42"
            y1="62"
            x2="68.4"
            y2="40"
            :style="{ strokeWidth: strokeWidth, stroke: color }"
            stroke-dasharray="35"
          />
        </g>
      </svg>
    </MdRoller>
  </div>
</template>

<script setup lang="ts">
import MdRoller from './Roller.vue'

defineOptions({ name: 'md-activity-indicator-rolling-success' })

withDefaults(
  defineProps<{
    isSuccess?: boolean
    size?: number
    color?: string
    strokeWidth?: number
  }>(),
  { isSuccess: true, size: 70, color: '#28AA8F', strokeWidth: 8 },
)
</script>
