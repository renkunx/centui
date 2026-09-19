<template>
  <div
    ref="root"
    class="md-steps"
    :class="{
      'md-steps-vertical': direction === 'vertical',
      'md-steps-horizontal': direction === 'horizontal',
      'vertical-adaptive': direction === 'vertical' && verticalAdaptive,
      'no-current': currentLength % 1 !== 0,
    }"
  >
    <slot v-if="custom" :steps="steps"></slot>
    <template v-else v-for="(step, index) of steps" :key="`steps-${index}`">
      <div class="step-wrapper" :class="getStepStatusClass(index)">
        <!-- 统一自定义图标 -->
        <div v-if="$slots.icon" class="icon-wrapper">
          <slot name="icon" :index="index" :current-index="currentLength"></slot>
        </div>
        <!-- 按状态自定义 -->
        <div v-else class="icon-wrapper">
          <template v-if="index < currentLength">
            <slot
              v-if="$slots.reached"
              name="reached"
              :index="index"
            ></slot>
            <div v-else class="step-node-default">
              <div class="step-node-default-icon" style="width: 6px; height: 6px; border-radius: 50%"></div>
            </div>
          </template>
          <template v-else-if="index === currentLength">
            <slot
              v-if="$slots.current"
              name="current"
              :index="index"
            ></slot>
            <MdIcon v-else name="success"></MdIcon>
          </template>
          <template v-else>
            <slot
              v-if="$slots.unreached"
              name="unreached"
              :index="index"
            ></slot>
            <div v-else class="step-node-default">
              <div class="step-node-default-icon" style="width: 6px; height: 6px; border-radius: 50%"></div>
            </div>
          </template>
        </div>
        <div class="text-wrapper">
          <slot
            v-if="$slots.content"
            name="content"
            :index="index"
            :step="step"
          ></slot>
          <template v-else>
            <div class="name">
              {{ step.name }}
            </div>
            <div v-if="step.text" class="desc">
              {{ step.text }}
            </div>
          </template>
        </div>
      </div>
      <div
        class="bar"
        :class="[direction === 'horizontal' ? 'horizontal-bar' : 'vertical-bar']"
        :style="getStepSizeForStyle(index)"
      >
        <i v-if="progress[index]" class="bar-inner" :style="barInnerStyle(index)"></i>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUpdated, ref, watch } from 'vue'
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-steps' })

export interface StepItem {
  name?: string
  text?: string
}

const props = withDefaults(
  defineProps<{
    steps?: StepItem[]
    current?: number
    direction?: 'horizontal' | 'vertical'
    transition?: boolean
    verticalAdaptive?: boolean
    custom?: boolean
  }>(),
  { steps: () => [], current: 0, direction: 'horizontal', transition: false, verticalAdaptive: false, custom: false },
)

const root = ref<HTMLElement>()
const initialed = ref(false)
const progress = ref<Array<{ len: number; time: number }>>([])
const stepsSize = ref<number[]>([])
const currentLength = ref(0)
const duration = 0.3
let timer: ReturnType<typeof setTimeout> | null = null

const barInnerStyle = (index: number) => {
  const p = progress.value
  const transform =
    props.direction === 'horizontal'
      ? `(${(p[index].len - 1) * 100}%, 0, 0)`
      : `(0, ${(p[index].len - 1) * 100}%, 0)`
  return {
    transform: `translate3d${transform}`,
    transition: `all ${p[index].time}s linear`,
  }
}

watch(
  () => props.current,
  (val, oldVal) => {
    const currentStep = formatValue(val)
    const newProgress = sliceProgress(currentStep)
    if (props.transition) {
      const isAdd = currentStep >= oldVal
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        doTransition(newProgress, isAdd, (len) => {
          if ((isAdd && len > currentLength.value) || (!isAdd && len < currentLength.value)) {
            currentLength.value = len
          }
        })
      }, 100)
    } else {
      progress.value = newProgress
      currentLength.value = currentStep
    }
  },
)

// created 语义：初始化进度
{
  const currentStep = formatValue(props.current)
  currentLength.value = currentStep
  progress.value = sliceProgress(currentStep)
}

onMounted(() => {
  initStepSize()
  initialed.value = true
})
onUpdated(() => {
  nextTick(() => {
    initStepSize()
  })
})

function initStepSize() {
  if (props.direction !== 'vertical' || props.verticalAdaptive) {
    return
  }
  const rootEl = root.value
  if (!rootEl) {
    return
  }
  const iconWrappers = rootEl.querySelectorAll('.icon-wrapper')
  const textWrappers = rootEl.querySelectorAll('.text-wrapper')
  const sizes = Array.from(textWrappers).map((wrapper, index) => {
    let stepHeight = wrapper.clientHeight
    const iconHeight = iconWrappers[index]?.clientHeight ?? 0
    if (index === textWrappers.length - 1) {
      // 末步需要扣除浮动高度
      stepHeight -= iconHeight
    } else {
      // 步骤间距
      stepHeight += 40
    }
    return stepHeight > 0 ? stepHeight : 0
  })

  if (sizes.toString() !== stepsSize.value.toString()) {
    stepsSize.value = sizes
  }
}

function getStepSizeForStyle(index: number) {
  const size = props.direction === 'vertical' && !props.verticalAdaptive ? stepsSize.value[index] : 0
  return size
    ? {
        height: `${size}px`,
      }
    : null
}

function getStepStatusClass(index: number) {
  const current = currentLength.value
  const status: string[] = []
  if (index < current) {
    status.push('reached')
  }
  if (index === Math.floor(current)) {
    status.push('current')
  }
  return status.join(' ')
}

function formatValue(val: number) {
  if (val < 0) {
    return 0
  } else if (val > props.steps.length - 1) {
    return props.steps.length - 1
  }
  return val
}

function sliceProgress(current: number) {
  return props.steps.slice(0, props.steps.length - 1).map((_step, index) => {
    const offset = current - index
    const old = progress.value[index]
    const isNewProgress = old === undefined
    let len: number
    if (offset <= 0) {
      len = 0
    } else if (offset >= 1) {
      len = 1
    } else {
      len = offset
    }
    const time = (isNewProgress ? len : Math.abs(old.len - len)) * duration
    return {
      len,
      time,
    }
  })
}

function doTransition(
  newProgress: Array<{ len: number; time: number }>,
  isAdd: boolean,
  step: (len: number) => void,
) {
  let current = isAdd ? 0 : currentLength.value
  const walk = (index: number) => {
    if (index < newProgress.length && index > -1 && newProgress[index]) {
      if (isAdd) {
        current += newProgress[index].len
      } else {
        current -= progress.value[index].len - newProgress[index].len
      }
      setTimeout(() => {
        walk(isAdd ? index + 1 : index - 1)
        step(current)
      }, newProgress[index].time * 1000)
    }
    progress.value[index] = newProgress[index]
  }
  walk(isAdd ? 0 : newProgress.length - 1)
}
</script>
