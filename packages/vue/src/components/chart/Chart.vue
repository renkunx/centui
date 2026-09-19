<template>
  <svg class="md-chart" :viewBox="`0 0 ${width} ${height}`">
    <defs>
      <linearGradient
        v-for="color in colors"
        :key="color"
        :id="`path-fill-gradient-${color}`"
        x1="0"
        x2="0"
        y1="0"
        y2="1"
      >
        <stop :style="`stop-color: ${color}`" offset="0%" stop-opacity="0.4"></stop>
        <stop :style="`stop-color: ${color}`" offset="50%" stop-opacity="0.3"></stop>
        <stop :style="`stop-color: ${color}`" offset="100%" stop-opacity="0.1"></stop>
      </linearGradient>
    </defs>
    <g class="md-chart-graph" :transform="`translate(${offset.left}, ${offset.top})`">
      <g class="md-chart-axis-y">
        <g v-for="(item, index) in yaxis" :key="index" :transform="`translate(0, ${item.offset})`">
          <line x1="0" :x2="innerWidth" y1="0" y2="0"></line>
          <text v-text="item.label" x="0" y="0" dx="-0.5em" dy="0.32em"></text>
        </g>
      </g>
      <g class="md-chart-axis-x" :transform="`translate(0, ${innerHeight})`">
        <g v-for="(item, index) in xaxis" :key="index" :transform="`translate(${item.offset}, 0)`">
          <line x1="0" x2="0" y1="0" y2="6"></line>
          <text v-text="item.label" x="0" y="0" dy="2em"></text>
        </g>
      </g>
      <g class="md-chart-paths">
        <template v-for="(path, index) in paths" :key="`path-${index}`">
          <path class="md-chart-path" :style="path.style" :d="path.value"></path>
          <path
            v-if="path.area"
            class="md-chart-path-area"
            :style="path.area.style"
            :d="path.area.value"
          ></path>
        </template>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ name: 'md-chart' })

export interface ChartDataset {
  color?: string
  width?: number
  theme?: string
  values: number[]
}

const props = withDefaults(
  defineProps<{
    labels?: string[]
    datasets?: ChartDataset[]
    size?: Array<string | number>
    max?: number
    min?: number
    lines?: number
    step?: number
    shift?: number
    format?: (val: number) => string | number
  }>(),
  {
    labels: () => [],
    datasets: () => [],
    size: () => [480, 320],
    max: undefined,
    min: undefined,
    lines: 5,
    step: undefined,
    shift: 0.6,
    format: (val: number) => val,
  },
)

const unit = ref(16)

// v2 default 函数语义：由 datasets 推导极值
const computedMax = computed(() => {
  if (props.max !== undefined) {
    return props.max
  }
  let max = Math.max.apply(
    Math,
    props.datasets.map(data => Math.max.apply(Math, data.values as never)),
  )
  let multiple = 1
  while (max > 10) {
    multiple *= 10
    max /= 10
  }
  return Math.ceil(max) * multiple
})

const computedMin = computed(() => {
  if (props.min !== undefined) {
    return props.min
  }
  let min = Math.min.apply(
    Math,
    props.datasets.map(data => Math.min.apply(Math, data.values as never)),
  )
  let multiple = 1
  while (min > 10) {
    multiple *= 10
    min = min / 10
  }
  return Math.floor(min) * multiple
})

const computedStep = computed(() =>
  props.step !== undefined ? props.step : (computedMax.value - computedMin.value) / props.lines,
)

const offset = computed(() => ({
  top: 0.2 * unit.value,
  bottom: 0.5 * unit.value,
  left: props.shift * unit.value,
  right: 0.2 * unit.value,
}))

const width = computed(() => {
  if (typeof props.size[0] === 'string' && props.size[0].indexOf('rem') !== -1) {
    return parseFloat(props.size[0]) * unit.value
  }
  return parseFloat(String(props.size[0]))
})

const height = computed(() => {
  if (typeof props.size[1] === 'string' && props.size[1].indexOf('rem') !== -1) {
    return parseFloat(props.size[1]) * unit.value
  }
  return parseFloat(String(props.size[1]))
})

const innerWidth = computed(() => width.value - offset.value.left - offset.value.right)
const innerHeight = computed(() => height.value - offset.value.top - offset.value.bottom)

const xaxis = computed(() => {
  const deltaX = innerWidth.value / (props.labels.length - 1)
  return props.labels.map((label, index) => ({
    offset: index * deltaX,
    label,
  }))
})

const yaxis = computed(() => {
  const items: Array<{ offset: number; label: string | number }> = []
  const deltaY = innerHeight.value / props.lines

  for (let i = 0; i < props.lines; i++) {
    items.push({
      offset: i * deltaY,
      label: props.format(computedMax.value - i * computedStep.value),
    })
  }

  items.push({
    offset: innerHeight.value,
    label: props.format(computedMin.value),
  })

  return items
})

const lower = computed(() => computedMax.value - (props.lines - 1) * computedStep.value)

const paths = computed(() => {
  return props.datasets.map(data => {
    const deltaX = innerWidth.value / (data.values.length - 1)
    const deltaY = innerHeight.value / props.lines
    const points = data.values.map((value, index) => {
      if (value < lower.value) {
        return {
          x: index * deltaX,
          y: innerHeight.value - (1 - (lower.value - value) / (lower.value - computedMin.value)) * deltaY,
        }
      } else {
        return {
          x: index * deltaX,
          y: (1 - (value - lower.value) / (computedMax.value - lower.value)) * (innerHeight.value - deltaY),
        }
      }
    })

    const ret = {
      style: {
        fill: 'none',
        stroke: data.color || '#fa8919',
        strokeWidth: data.width || 1,
      },
      area: undefined as undefined | { value: string; style: Record<string, string> },
      value: '',
    }

    if (data.theme === 'heat') {
      ret.style.stroke = `url(#path-fill-gradient-${data.color})`
    } else if (data.theme === 'region') {
      ret.area = {
        value:
          `M0,${innerHeight.value} ` +
          points.map(point => `L${point.x},${point.y}`).join(' ') +
          ` L${points[points.length - 1].x},${innerHeight.value}`,
        style: {
          fill: `url(#path-fill-gradient-${data.color})`,
          stroke: 'none',
        },
      }
    }

    const rest = points.slice(1)
    ret.value = `M0,${points.shift()!.y} ` + rest.map(point => `L${point.x},${point.y}`).join(' ')

    return ret
  })
})

const colors = computed(() => {
  const uniqueColors: string[] = []
  props.datasets.forEach(data => {
    if (data.color && uniqueColors.indexOf(data.color) === -1) {
      uniqueColors.push(data.color)
    }
  })
  return uniqueColors
})

function resize() {
  unit.value = parseFloat(
    window.getComputedStyle(document.getElementsByTagName('html')[0]).getPropertyValue('font-size'),
  )
}

onMounted(() => {
  if (document.readyState !== 'loading') {
    resize()
  }
  document.addEventListener('DOMContentLoaded', resize)
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  document.removeEventListener('DOMContentLoaded', resize)
  window.removeEventListener('resize', resize)
})
</script>
