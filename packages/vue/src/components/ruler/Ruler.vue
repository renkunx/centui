<template>
  <div
    class="md-ruler"
    @touchstart="startDrag"
    @touchend="stopDrag"
  >
    <canvas ref="canvas" class="md-ruler-canvas"></canvas>
    <div class="md-ruler-cursor" :class="[isStepTextBottom && 'md-ruler-cursor-bottom']"></div>
    <div class="md-ruler-arrow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Scroller } from '@mand-mobile/core/web'
import { throttle } from '@mand-mobile/core'

defineOptions({ name: 'md-ruler' })

const props = withDefaults(
  defineProps<{
    value?: number
    scope?: Array<number>
    step?: number
    unit?: number
    min?: number
    max?: number
    /** top | bottom */
    stepTextPosition?: 'top' | 'bottom'
    stepTextRender?: (step: number) => string | number | undefined | null
  }>(),
  {
    value: 0,
    scope: () => [0, 100],
    step: 10,
    unit: 1,
    min: 0,
    max: 100,
    stepTextPosition: 'top',
    stepTextRender: () => undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'input', value: number): void
  (e: 'change', value: number): void
}>()

const canvas = ref<HTMLCanvasElement>()

const CLIENT_HEIGHT = 60
const RATIO = 2
const BLANK = 30

let ctx: CanvasRenderingContext2D | null = null
let scroller: Scroller | null = null

const isInitialed = ref(false)
const isDragging = ref(false)
const isScrolling = ref(false)

const x = ref(0)
let scrollingX = 0

const unitCount = computed(() => Math.ceil((props.scope[1] - props.scope[0]) / props.unit))

const canvasWidth = computed(() => (canvas.value?.clientWidth ?? 0) * RATIO)

const realMin = computed(() => {
  const [left, right] = props.scope
  if (props.min > right) {
    return left
  }
  return props.min > left ? props.min : left
})

const realMax = computed(() => {
  const [left, right] = props.scope
  if (left > props.max) {
    return right
  }
  return props.max > right ? right : props.max
})

const blankLeft = computed(
  () => Math.ceil((realMin.value - props.scope[0]) / props.unit) * BLANK,
)

const blankRight = computed(
  () => Math.ceil((props.scope[1] - realMax.value) / props.unit) * BLANK,
)

const isStepTextBottom = computed(() => props.stepTextPosition === 'bottom')

watch(
  () => props.value,
  () => {
    if (isScrolling.value) {
      return
    }
    scrollingX = 0
    isScrolling.value = true
    const nextX = initX()
    draw(nextX)
    scroller?.scrollTo(nextX, 0, true)
  },
)

onMounted(() => {
  // jsdom 无 canvas 实现：ctx 为 null 时跳过绘制，仅保留交互骨架
  ctx = canvas.value?.getContext('2d') ?? null

  initCanvas()
  x.value = canvasWidth.value
  initScroller()
})

function initCanvas() {
  const cv = canvas.value
  if (!cv || !ctx) {
    return
  }
  cv.width = canvasWidth.value
  cv.height = CLIENT_HEIGHT * RATIO

  ctx.scale(1 / RATIO, 1)
}

function initScroller() {
  const drawThrottled = throttle((left: number) => draw(left), 10)
  const sc = new Scroller(
    (left) => {
      if (isInitialed.value) {
        drawThrottled(left)
      } else {
        draw(left)
      }
    },
    {
      scrollingX: true,
      scrollingY: false,
      snapping: true,
      snappingVelocity: 1,
      animationDuration: 200,
      inRequestAnimationFrame: true,
      scrollingComplete: () => {
        isScrolling.value = false
      },
    },
  )

  // 实际可滚动宽度
  const innerWidth = unitCount.value * BLANK + canvasWidth.value - blankLeft.value - blankRight.value
  const nextX = initX()
  draw(nextX)
  sc.setDimensions(canvasWidth.value, CLIENT_HEIGHT, innerWidth, CLIENT_HEIGHT)
  sc.setSnapSize(BLANK, 0)
  sc.scrollTo(nextX, 0, false)

  scroller = sc
  isInitialed.value = true
}

function initX() {
  const [min] = props.scope
  x.value = canvasWidth.value - Math.ceil((realMin.value - min) / props.unit) * BLANK

  if (props.value <= realMin.value) {
    return 0
  } else if (props.value >= realMax.value) {
    return unitCount.value * BLANK
  } else {
    return Math.ceil((props.value - realMin.value) / props.unit) * BLANK
  }
}

function draw(left: number) {
  if (!ctx) {
    return
  }
  left = +left.toFixed(2)

  scrollingX = left
  x.value += scrollingX - left

  // 清除画布
  const scale = RATIO * RATIO
  ctx.clearRect(0, 0, canvasWidth.value * scale, CLIENT_HEIGHT * scale)

  drawLine()
}

function drawLine() {
  if (!ctx) {
    return
  }
  const c = ctx
  const [scopeLeft] = props.scope

  const fontSize = 22
  const y = 120 - (isStepTextBottom.value ? fontSize + 40 : 0)
  const stepUnit = Math.round(props.step / props.unit)

  c.lineWidth = 2
  c.font = `${fontSize * RATIO}px DIDIFD-Medium, "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif`

  for (let i = 0; i <= unitCount.value; i++) {
    const cx = x.value + i * BLANK

    if (cx < 0 || cx > canvasWidth.value * 2) {
      continue
    }

    // 超出范围用另一色
    const outRange = cx < x.value + blankLeft.value || cx > x.value + 1 + unitCount.value * BLANK - blankRight.value
    if (outRange) {
      c.fillStyle = '#E2E4EA'
      c.strokeStyle = '#E2E4EA'
    } else {
      c.fillStyle = '#C5CAD5'
      c.strokeStyle = '#858B9C'
    }

    c.beginPath()
    c.moveTo(cx, y)

    if (i % stepUnit === 0) {
      // 刻度文本
      const text = matchStepText(scopeLeft + props.unit * i)
      const textOffset = (String(text).length * fontSize) / 2
      c.fillText(String(text), cx - textOffset, fontSize * RATIO + (isStepTextBottom.value ? 70 : 0))

      // 长刻度线
      c.lineTo(cx, y - 40)
    } else {
      c.lineTo(cx, y - 20)
    }
    c.stroke()
  }

  // 基线
  c.strokeStyle = '#E2E4EA'
  c.beginPath()
  c.moveTo(x.value, y)
  c.lineTo(x.value + unitCount.value * BLANK, y)
  c.stroke()

  updateValue()
}

function matchStepText(step: number) {
  const match = props.stepTextRender?.(step)
  return match !== undefined && match !== null ? match : step
}

let touchDragging = false
function startDrag(event: TouchEvent) {
  if (isDragging.value || touchDragging) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  scroller?.doTouchStart(Array.from(event.touches), event.timeStamp)

  isDragging.value = true
  touchDragging = true
  isScrolling.value = true

  const onDrag = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging.value) {
      return
    }
    scroller?.doTouchMove(Array.from(e.touches), e.timeStamp, (e as TouchEvent & { scale?: number }).scale)
  }
  const onStop = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = false
    touchDragging = false

    scroller?.doTouchEnd(e.timeStamp)

    window.removeEventListener('touchmove', onDrag)
    window.removeEventListener('touchend', onStop)
  }
  window.addEventListener('touchmove', onDrag)
  window.addEventListener('touchend', onStop)
}
// 兼容 v2 stopDrag 命名（模板 touchend 未绑定，实际由 window 监听处理）
const stopDrag = (event: TouchEvent) => {
  event.preventDefault()
}

function updateValue() {
  if (!isInitialed.value) {
    return
  }

  const [min] = props.scope

  if (x.value > canvasWidth.value) {
    onInput(realMin.value)
    return
  }

  const absX = x.value >= 0 ? Math.abs(x.value - canvasWidth.value) : Math.abs(x.value) + canvasWidth.value
  let value = min + Math.round(absX / BLANK) * props.unit

  value > realMax.value && (value = realMax.value)
  value < realMin.value && (value = realMin.value)
  onInput(value)
}

function onInput(value: number) {
  emit('update:modelValue', value)
  emit('input', value)
  emit('change', value)
}
</script>
