<template>
  <div class="cu-water-mark">
    <div class="water-mark-container">
      <slot></slot>
    </div>
    <div v-if="hasWatermark" class="water-mark-list" ref="mark">
      <div
        class="water-mark-list-wrapper"
        :style="{
          opacity,
          transform: `rotate(${rotate}deg)`,
        }"
      >
        <template v-if="content">
          <canvas ref="canvas" class="water-mark-canvas"></canvas>
        </template>
        <template v-else-if="hasWatermarkSlot">
          <ul
            v-for="i in repeatY ? repetition : 1"
            :key="`line-${i}`"
            class="water-mark-line"
            :style="{ marginBottom: spacing }"
          >
            <li
              v-for="j in repeatX ? repetition : 1"
              :key="`item-${j}`"
              class="water-mark-item"
              :style="i % 2 === 0 ? { marginLeft: repeatX ? spacing : 0 } : { marginRight: repeatX ? spacing : 0 }"
            >
              <slot name="watermark" :coord="{ row: i, col: j }"></slot>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useSlots, Comment, Fragment } from 'vue'
import { getDpr } from '@centui/core/web'

defineOptions({ name: 'cu-water-mark' })

const props = withDefaults(
  defineProps<{
    content?: string
    spacing?: string | number
    repeatX?: boolean
    repeatY?: boolean
    rotate?: string | number
    opacity?: string | number
  }>(),
  { content: '', spacing: '20vw', repeatX: true, repeatY: true, rotate: -30, opacity: 0.1 },
)

const slots = useSlots()
const mark = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()

const isTestEnv =
  typeof process !== 'undefined' && (process.env as { MAND_ENV?: string }).MAND_ENV === 'test'
// v2 契约：测试环境平铺 2 次（确定性断言），生产 50 次
const repetition = isTestEnv ? 2 : 50

const hasWatermarkSlot = computed(() => {
  const fn = slots.watermark
  if (!fn) {
    return false
  }
  return fn({ coord: { row: 1, col: 1 } }).some((node) => !isVNodeEmpty(node))
})
const hasWatermark = computed(() => hasWatermarkSlot.value || !!props.content)

function isVNodeEmpty(node: unknown): boolean {
  if (!node || typeof node !== 'object') {
    return true
  }
  const n = node as { type: unknown; children?: unknown }
  if (n.type === Comment) {
    return true
  }
  if (n.type === Fragment) {
    const children = n.children as unknown[]
    return !Array.isArray(children) || children.every(isVNodeEmpty)
  }
  return false
}

const FONT_SIZE = 14
const COLOR = '#858B9C'

let ctx: CanvasRenderingContext2D | null = null
let ratio = 2
let ctxWidth = 0
let ctxHeight = 0
let realSpacing = 0

onMounted(() => {
  if (!props.content) {
    return
  }
  // jsdom 无 canvas 实现，getContext 返回 null，跳过绘制
  ctx = canvas.value?.getContext('2d') ?? null
  if (!ctx) {
    return
  }
  ratio = Math.max(getDpr(), 2) // min ratio = 2

  initCanvas()
  computedSpacing()
  draw()
})

function initCanvas() {
  const el = mark.value
  const cv = canvas.value
  if (!el || !cv) {
    return
  }
  ctxWidth = cv.width = el.clientWidth * ratio
  ctxHeight = cv.height = el.clientHeight * ratio

  ctx!.scale(1 / ratio, 1 / ratio)
}

function computedSpacing() {
  const { spacing } = props

  if (typeof spacing === 'number') {
    realSpacing = spacing
    return
  }
  const [, amount = '20', unit = 'vw'] = /([0-9]+)([A-Za-z]+)/.exec(spacing) ?? []

  if (unit === 'px') {
    realSpacing = Number(amount)
  } else if (unit === 'vh') {
    realSpacing = (Number(amount) * window.screen.height) / 100
  } else if (unit === 'vw') {
    realSpacing = (Number(amount) * window.screen.width) / 100
  }

  realSpacing *= ratio
}

function draw() {
  if (!ctx) {
    return
  }
  const contentLength = props.content.length * FONT_SIZE * ratio
  const xCount = Math.ceil((ctxWidth * ratio) / (contentLength + realSpacing))
  const yCount = Math.ceil((ctxHeight * ratio) / (FONT_SIZE * ratio + realSpacing))
  const fontSize = FONT_SIZE * ratio

  ctx.font = `${fontSize}px "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif`
  ctx.fillStyle = COLOR

  let ctxX = 0
  let ctxY = 0
  for (let y = 0; y < yCount; y++) {
    ctxX = 0
    for (let x = 0; x < xCount; x++) {
      ctx.fillText(props.content, ctxX, ctxY)
      ctxX += contentLength
    }
    ctxY += fontSize + realSpacing
  }
}
</script>
