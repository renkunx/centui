<template>
  <div class="md-slider" :class="{ 'is-disabled': disabled }">
    <template v-if="range">
      <div class="md-slider-bar" :style="barStyle"></div>
      <div
        class="md-slider-handle is-lower"
        :data-hint="format(values[0])"
        :class="{ 'is-active': isDragging && !isDragingUpper }"
        :style="{ left: lowerHandlePosition + '%' }"
      >
        <span @mousedown="startLowerDrag" @touchstart="startLowerDrag"></span>
      </div>
      <div
        class="md-slider-handle is-higher"
        :data-hint="format(values[1])"
        :class="{ 'is-active': isDragging && isDragingUpper }"
        :style="{ left: upperHandlePosition + '%' }"
      >
        <span @mousedown="startUpperDrag" @touchstart="startUpperDrag"></span>
      </div>
    </template>
    <template v-else>
      <div class="md-slider-bar" :style="barStyle"></div>
      <div
        class="md-slider-handle"
        :data-hint="format(values[0])"
        :class="{ 'is-active': isDragging }"
        :style="{ left: lowerHandlePosition + '%' }"
      >
        <span @mousedown="startLowerDrag" @touchstart="startLowerDrag"></span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

defineOptions({ name: 'md-slider' })

const props = withDefaults(
  defineProps<{
    modelValue?: number | Array<number>
    min?: number
    max?: number
    step?: number
    range?: boolean
    format?: (val: number) => number | string
    disabled?: boolean
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    range: false,
    format: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | Array<number>): void
}>()

const isDragging = ref(false)
const isDragingUpper = ref(false)
const values = ref<[number, number]>([props.min, props.max])
let startDragMousePos = 0
let startVal = 0

const format = (val: number) => props.format?.(val) ?? val

watch(
  () => props.modelValue,
  val => {
    if (
      (Array.isArray(val) && (val[0] !== values.value[0] || val[1] !== values.value[1])) ||
      (!Array.isArray(val) && val !== values.value[0])
    ) {
      updateValue(val)
    }
  },
  { immediate: true },
)

watch(
  () => props.disabled,
  newVal => {
    if (!newVal) {
      stopDrag()
    }
  },
)

const lowerHandlePosition = computed(
  () => ((values.value[0] - props.min) / (props.max - props.min)) * 100,
)
const upperHandlePosition = computed(
  () => ((values.value[1] - props.min) / (props.max - props.min)) * 100,
)
const barStyle = computed(() => {
  if (props.range) {
    return {
      width: ((values.value[1] - values.value[0]) / (props.max - props.min)) * 100 + '%',
      left: lowerHandlePosition.value + '%',
    }
  }
  return {
    width: ((values.value[0] - props.min) / (props.max - props.min)) * 100 + '%',
  }
})

function updateValue(newVal: number | Array<number>) {
  const newValues: [number | undefined, number | undefined] = [
    undefined as number | undefined,
    undefined as number | undefined,
  ]

  if (Array.isArray(newVal)) {
    newValues[0] = newVal[0]
    newValues[1] = newVal[1]
  } else {
    newValues[0] = newVal
  }

  if (typeof newValues[0] !== 'number') {
    newValues[0] = values.value[0]
  } else {
    newValues[0] = Math.round((newValues[0] - props.min) / props.step) * props.step + props.min
  }

  if (typeof newValues[1] !== 'number') {
    newValues[1] = values.value[1]
  } else {
    newValues[1] = Math.round((newValues[1] - props.min) / props.step) * props.step + props.min
  }

  // value boundary adjust
  if (newValues[0]! < props.min) {
    newValues[0] = props.min
  }
  if (newValues[1]! > props.max) {
    newValues[1] = props.max
  }
  if (newValues[0]! > newValues[1]!) {
    if (newValues[0] === values.value[0]) {
      newValues[1] = newValues[0]
    } else {
      newValues[0] = newValues[1]
    }
  }

  if (values.value[0] === newValues[0] && values.value[1] === newValues[1]) {
    return
  }

  values.value = [newValues[0]!, newValues[1]!]

  if (props.range) {
    emit('update:modelValue', values.value)
  } else {
    emit('update:modelValue', values.value[0])
  }
}

function startLowerDrag(e: Event) {
  if (props.disabled) {
    return
  }
  e.preventDefault()
  e.stopPropagation()
  const point = ('changedTouches' in e
    ? (e as TouchEvent).changedTouches[0]
    : (e as MouseEvent)) as MouseEvent
  startDragMousePos = point.pageX
  startVal = values.value[0]
  isDragingUpper.value = false
  isDragging.value = true
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('touchmove', onDrag)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('touchend', onUp)
}

function startUpperDrag(e: Event) {
  if (props.disabled) {
    return
  }
  e.preventDefault()
  e.stopPropagation()
  const point = ('changedTouches' in e
    ? (e as TouchEvent).changedTouches[0]
    : (e as MouseEvent)) as MouseEvent
  startDragMousePos = point.pageX
  startVal = values.value[1]
  isDragingUpper.value = true
  isDragging.value = true
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('touchmove', onDrag)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('touchend', onUp)
}

function onDrag(e: Event) {
  if (props.disabled) {
    return
  }
  e.preventDefault()
  e.stopPropagation()
  if (!isDragging.value) {
    return
  }
  const point = ('changedTouches' in e
    ? (e as TouchEvent).changedTouches[0]
    : (e as MouseEvent)) as MouseEvent
  const el = document.querySelector<HTMLElement>('.md-slider')
  window.requestAnimationFrame(() => {
    const diff = ((point.pageX - startDragMousePos) / el!.offsetWidth) * (props.max - props.min)
    const nextVal = startVal + diff
    if (isDragging.value) {
      if (isDragingUpper.value) {
        updateValue([null as unknown as number, nextVal])
      } else {
        updateValue([nextVal, null as unknown as number])
      }
    }
  })
}

function onUp(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  stopDrag()
}

function stopDrag() {
  isDragging.value = false
  isDragingUpper.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('mouseup', onUp)
  window.removeEventListener('touchend', onUp)
}
</script>
