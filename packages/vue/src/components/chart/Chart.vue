<template>
  <svg class="cu-chart" :viewBox="`0 0 ${width} ${height}`">
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
    <g class="cu-chart-graph" :transform="`translate(${offset.left}, ${offset.top})`">
      <g class="cu-chart-axis-y">
        <g v-for="(item, index) in yaxis" :key="index" :transform="`translate(0, ${item.offset})`">
          <line x1="0" :x2="innerWidth" y1="0" y2="0"></line>
          <text v-text="item.label" x="0" y="0" dx="-0.5em" dy="0.32em"></text>
        </g>
      </g>
      <g class="cu-chart-axis-x" :transform="`translate(0, ${innerHeight})`">
        <g v-for="(item, index) in xaxis" :key="index" :transform="`translate(${item.offset}, 0)`">
          <line x1="0" x2="0" y1="0" y2="6"></line>
          <text v-text="item.label" x="0" y="0" dy="2em"></text>
        </g>
      </g>
      <g class="cu-chart-paths">
        <template v-for="(path, index) in paths" :key="`path-${index}`">
          <path v-if="path.value" class="cu-chart-path" :style="path.style" :d="path.value"></path>
          <path
            v-if="path.area"
            class="cu-chart-path-area"
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
import {
  computeMax,
  computeMin,
  computeOffsets,
  computeSeries,
  computeStep,
  computeXAxis,
  computeYAxis,
  resolveSize,
} from '@centui/core'

defineOptions({ name: 'cu-chart' })

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

// 极值/坐标换算与 React、微信小程序共用 @centui/core 的同一实现
const computedMax = computed(() => computeMax(props.datasets, props.max))
const computedMin = computed(() => computeMin(props.datasets, props.min))
const computedStep = computed(() =>
  computeStep(computedMax.value, computedMin.value, props.step, props.lines),
)

const offset = computed(() => computeOffsets(props.shift, unit.value))
const dimensions = computed(() => resolveSize(props.size, unit.value))
const width = computed(() => dimensions.value[0])
const height = computed(() => dimensions.value[1])

const innerWidth = computed(() => width.value - offset.value.left - offset.value.right)
const innerHeight = computed(() => height.value - offset.value.top - offset.value.bottom)

const xaxis = computed(() => computeXAxis(props.labels, innerWidth.value))

const yaxis = computed(() =>
  computeYAxis(
    props.lines,
    innerHeight.value,
    computedMax.value,
    computedMin.value,
    computedStep.value,
    val => String(props.format(val)),
  ),
)

const series = computed(() =>
  computeSeries(props.datasets, {
    innerWidth: innerWidth.value,
    innerHeight: innerHeight.value,
    lines: props.lines,
    max: computedMax.value,
    min: computedMin.value,
    step: computedStep.value,
  }),
)

const paths = computed(() => {
  return series.value.map((item, index) => {
    const data = props.datasets[index]
    const points = item.points
    const ret = {
      style: {
        fill: 'none',
        stroke: item.color,
        strokeWidth: item.lineWidth,
      },
      area: undefined as undefined | { value: string; style: Record<string, string> },
      value: '',
    }

    if (data.theme === 'heat') {
      ret.style.stroke = `url(#path-fill-gradient-${data.color})`
    } else if (data.theme === 'region' && points.length > 0) {
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

    if (points.length > 0) {
      ret.value =
        `M0,${points[0].y} ` + points.slice(1).map(point => `L${point.x},${point.y}`).join(' ')
    }

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
