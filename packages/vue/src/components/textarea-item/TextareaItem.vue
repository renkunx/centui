<template>
  <MdFieldItem
    class="md-textarea-item"
    :class="[isDisabled ? 'is-disabled' : '', errorInfo ? 'is-error' : '']"
    :title="title"
    :solid="solid"
  >
    <textarea
      ref="textarea"
      v-model="inputValue"
      class="md-textarea-item__textarea"
      :disabled="isDisabled"
      :readonly="readonly"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :rows="rows"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keyup="onKeyup"
      @keydown="onKeydown"
    ></textarea>
    <slot name="footer"></slot>
    <template #right>
      <div
        v-if="clearable && !isDisabled && !readonly"
        v-show="!isInputEmpty && isInputFocus"
        class="md-textarea-item__clear"
        @click="clearInput"
      >
        <MdIcon name="clear"></MdIcon>
      </div>
      <slot name="right"></slot>
    </template>
    <template #children>
      <div v-if="errorInfo" class="md-textarea-item-msg">
        <p>{{ errorInfo }}</p>
      </div>
    </template>
  </MdFieldItem>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import MdFieldItem from '../field-item/FieldItem.vue'
import MdIcon from '../icon/Icon.vue'
import { getCursorsPosition, setCursorsPosition } from '../input-item/cursor'

defineOptions({ name: 'md-textarea-item' })

const props = withDefaults(
  defineProps<{
    title?: string
    name?: string | number
    placeholder?: string
    value?: string
    maxLength?: string | number
    maxHeight?: string | number
    solid?: boolean
    readonly?: boolean
    disabled?: boolean
    clearable?: boolean
    rows?: string | number
    autosize?: boolean
    error?: string
    formation?: (name: string | number, value: string, pos: number) => { value: string; range: number } | undefined
  }>(),
  {
    title: '',
    name: () => `textarea-item-${Math.floor(Math.random() * 10000)}`,
    placeholder: '',
    value: '',
    maxLength: '',
    maxHeight: '',
    solid: true,
    readonly: false,
    disabled: false,
    clearable: false,
    rows: '3',
    autosize: false,
    error: '',
    formation: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'input', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'keyup', event: KeyboardEvent): void
  (e: 'keydown', event: KeyboardEvent): void
}>()

const maxHeightInner = ref<string | number>(props.maxHeight)
const inputValue = ref(props.value)
const isInputFocus = ref(false)
const textarea = ref<HTMLTextAreaElement>()

const isDisabled = computed(() => props.disabled)
const errorInfo = computed(() => props.error)
const isInputEmpty = computed(() => !inputValue.value.length)

watch(
  () => props.value,
  (val) => {
    inputValue.value = val
    nextTick(() => {
      resizeTextarea()
    })
  },
)
watch(inputValue, (val) => {
  emit('update:modelValue', val)
  emit('change', val)
})
watch(
  () => props.maxHeight,
  (val) => {
    maxHeightInner.value = val
    resizeTextarea()
  },
)

onMounted(() => {
  resizeTextarea()
})

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  const formatedValue = formatValue(target.value, getCursorsPosition(target))

  inputValue.value = formatedValue.value

  nextTick(() => {
    setCursorsPosition(target, formatedValue.range)
    resizeTextarea()
  })
}

function formatValue(curValue: string, curPos = 0) {
  // 自定义格式化
  const customValue = props.formation?.(props.name, curValue, curPos)

  if (customValue) {
    return customValue
  }

  // 无格式化
  return { value: curValue, range: curPos }
}

function clearInput() {
  inputValue.value = ''
  nextTick(() => {
    resizeTextarea()
  })
  focus()
}

function onKeyup(event: KeyboardEvent) {
  emit('keyup', event)
}
function onKeydown(event: KeyboardEvent) {
  emit('keydown', event)
}
function onFocus() {
  isInputFocus.value = true
  emit('focus')
}
function onBlur() {
  setTimeout(() => {
    isInputFocus.value = false
    emit('blur')
  }, 100)
}

function calcTextareaHeight(el: HTMLTextAreaElement) {
  // 触发重绘
  el.style.height = 'auto'

  let scrollHeight = el.scrollHeight
  // 不可见时跳过高度计算
  if (scrollHeight === 0) {
    return
  }

  if (maxHeightInner.value && scrollHeight > Number(maxHeightInner.value)) {
    scrollHeight = Number(maxHeightInner.value)
  }

  el.style.height = scrollHeight + 'px'
}

// MARK: public methods
function resizeTextarea() {
  if (props.autosize) {
    calcTextareaHeight(textarea.value!)
  }
}

function focus() {
  textarea.value?.focus()
  setTimeout(() => {
    isInputFocus.value = true
  }, 200)
}

function blur() {
  textarea.value?.blur()
  isInputFocus.value = false
}

function getValue() {
  return inputValue.value
}

defineExpose({ resizeTextarea, focus, blur, getValue })
</script>
