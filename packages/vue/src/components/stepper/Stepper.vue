<template>
  <div class="cu-stepper" :class="{ disabled }">
    <div
      class="cu-stepper-button cu-stepper-button-reduce"
      :class="{ disabled: isMin }"
      @click="reduce"
    ></div>
    <div class="cu-stepper-number">
      <input
        :type="!isInteger ? 'number' : 'tel'"
        :size="contentLength"
        :value="currentNum"
        :readonly="readOnly"
        @input="onInput"
        @focus="onFocus"
        @blur="onChange"
      />
    </div>
    <div
      class="cu-stepper-button cu-stepper-button-add"
      :class="{ disabled: isMax }"
      @click="add"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { warn } from '@centui/core'

defineOptions({ name: 'cu-stepper' })

const props = withDefaults(
  defineProps<{
    defaultValue?: number | string
    modelValue?: number | string
    step?: number | string
    min?: number | string
    max?: number | string
    disabled?: boolean
    readOnly?: boolean
    isInteger?: boolean
  }>(),
  {
    defaultValue: 0,
    modelValue: 0,
    step: 1,
    min: -Number.MAX_VALUE,
    max: Number.MAX_VALUE,
    disabled: false,
    readOnly: false,
    isInteger: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
  (e: 'increase', diff: number): void
  (e: 'decrease', diff: number): void
}>()

function getDecimalNum(num: number | string): number {
  try {
    return num.toString().split('.')[1].length
  } catch {
    return 0
  }
}

function accAdd(num1: number | string, num2: number | string): number {
  const n1 = Number(num1)
  const n2 = Number(num2)
  const r1 = getDecimalNum(num1)
  const r2 = getDecimalNum(num2)
  const m = Math.pow(10, Math.max(r1, r2))
  return +((n1 * m + n2 * m) / m)
}

function subtr(num1: number | string, num2: number | string): number {
  const n1 = Number(num1)
  const n2 = Number(num2)
  const r1 = getDecimalNum(num1)
  const r2 = getDecimalNum(num2)
  const m = Math.pow(10, Math.max(r1, r2))
  const n = r1 >= r2 ? r1 : r2
  return +((n1 * m - n2 * m) / m).toFixed(n)
}

const isMin = ref(false)
const isMax = ref(false)
const isEditing = ref(false)
const currentNum = ref<number>(0)

const contentLength = computed(() => {
  if (!props.modelValue) {
    return 2
  }
  const length = props.modelValue.toString().length
  return length > 2 ? length : 2
})

watch(
  () => props.defaultValue,
  (val) => {
    currentNum.value = getCurrentNum(val)
  },
)

watch(
  () => props.modelValue,
  (val) => {
    if (isEditing.value) {
      return
    }
    currentNum.value = getCurrentNum(val)
  },
)

watch(
  () => props.min,
  (val) => {
    const min = Number(val)
    if (currentNum.value < min) {
      currentNum.value = min
    }
    checkStatus()
  },
)

watch(
  () => props.max,
  (val) => {
    const max = Number(val)
    if (currentNum.value > max) {
      currentNum.value = max
    }
    checkStatus()
  },
)

watch(currentNum, (val, oldVal) => {
  checkStatus()

  if (val !== props.modelValue) {
    emit('update:modelValue', val)
    emit('change', val)
  }

  const diff = val - oldVal

  // judge the event of operation
  if (diff > 0) {
    emit('increase', diff)
  } else if (diff < 0) {
    emit('decrease', Math.abs(diff))
  }
})

onMounted(() => {
  // verify that the minimum value is less than the maximum value
  checkMinMax()
  currentNum.value = getCurrentNum(props.modelValue || props.defaultValue)
  checkStatus()
})

function reduce() {
  if (props.disabled || isMin.value) {
    return
  }
  currentNum.value = subtr(currentNum.value, props.step)
  onChange()
}

function add() {
  if (props.disabled || isMax.value) {
    return
  }
  currentNum.value = accAdd(currentNum.value, props.step)
  onChange()
}

function formatNum(value: number | string): number {
  const str = String(value).replace(/[^0-9.-]|^-|^\./g, '')
  return str === '' ? 0 : props.isInteger ? Math.floor(Number(str)) : +str
}

function getCurrentNum(value: number | string): number {
  return Math.max(Math.min(Number(props.max), formatNum(value)), Number(props.min))
}

function checkStatus() {
  isMin.value = currentNum.value <= Number(props.min)
  isMax.value = currentNum.value >= Number(props.max)
}

function checkMinMax() {
  if (Number(props.min) > Number(props.max)) {
    warn('[cu-vue-stepper] minNum is larger than maxNum')
  }
  return Number(props.max) > Number(props.min)
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const { value } = target
  const formatted = formatNum(value)
  if (+value !== formatted) {
    target.value = String(formatted)
  }
  currentNum.value = formatted
}

function onFocus() {
  isEditing.value = true
}

function onChange() {
  isEditing.value = false
  currentNum.value = getCurrentNum(currentNum.value)
}
</script>
