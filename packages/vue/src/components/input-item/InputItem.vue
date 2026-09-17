<template>
  <MdFieldItem
    ref="root"
    class="md-input-item"
    :class="[
      isHighlight ? 'is-highlight' : '',
      isTitleLatent ? 'is-title-latent' : '',
      isInputActive ? 'is-active' : '',
      isInputFocus ? 'is-focus' : '',
      hasInputError ? 'is-error' : '',
      hasInputBrief && !hasInputError ? 'with-brief' : '',
      isDisabled ? 'is-disabled' : '',
      isAmount ? 'is-amount' : '',
      clearable ? 'is-clear' : '',
      align,
      size,
    ]"
    :title="title"
    :solid="solid && !isTitleLatent"
  >
    <template #left>
      <slot name="left"></slot>
    </template>
    <!-- Native Input -->
    <template v-if="!isVirtualKeyboard">
      <input
        class="md-input-item-input"
        :type="inputType"
        :name="name"
        :value="inputBindValue"
        :placeholder="inputPlaceholder"
        :disabled="isDisabled"
        :readonly="readonly"
        :maxlength="isInputFormative ? '' : inputMaxLength"
        autocomplete="off"
        @focus="onFocus"
        @blur="onBlur"
        @keyup="onKeyup"
        @keydown="onKeydown"
        @input="onInput"
      />
    </template>
    <!-- Fake Input -->
    <template v-else>
      <div
        class="md-input-item-fake"
        :class="{
          'is-focus': isInputFocus,
          'is-waiting': !isInputEditing,
          disabled: isDisabled,
          readonly: readonly,
        }"
        @click="onFakeInputClick"
      >
        <span v-text="inputValue"></span>
        <span
          v-if="inputValue === '' && inputPlaceholder !== ''"
          class="md-input-item-fake-placeholder"
          v-text="inputPlaceholder"
        ></span>
      </div>
    </template>

    <template #right>
      <div
        v-if="clearable && !isDisabled && !readonly"
        v-show="!isInputEmpty && isInputFocus"
        class="md-input-item-clear"
        @click="clearInput"
      >
        <MdIcon name="clear"></MdIcon>
      </div>
      <slot name="right"></slot>
    </template>

    <template #children>
      <div v-if="hasInputError" class="md-input-item-msg">
        <p v-if="error !== ''" v-text="error"></p>
        <slot v-else name="error"></slot>
      </div>
      <div v-if="hasInputBrief && !hasInputError" class="md-input-item-brief">
        <p v-if="brief !== ''" v-text="brief"></p>
        <slot v-else name="brief"></slot>
      </div>
      <MdNumberKeyboard
        v-if="isVirtualKeyboard && !virtualKeyboardVm"
        ref="numberKeyboard"
        :id="`${name}-number-keyboard`"
        class="md-input-item-number-keyboard"
        :ok-text="virtualKeyboardOkText"
        :disorder="virtualKeyboardDisorder"
        @enter="onNumberKeyBoardEnter"
        @delete="onNumberKeyBoardDelete"
        @confirm="onNumberKeyBoardConfirm"
      ></MdNumberKeyboard>
    </template>
  </MdFieldItem>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { randomId } from '@mand-mobile/core'
import {
  formatValueByGapRule,
  formatValueByGapStep,
  trimValue,
  type FormattedValue,
} from '@mand-mobile/core'
import MdFieldItem from '../field-item/FieldItem.vue'
import MdIcon from '../icon/Icon.vue'
import MdNumberKeyboard from '../number-keyboard/NumberKeyboard.vue'
import { getCursorsPosition, setCursorsPosition } from './cursor'

defineOptions({ name: 'md-input-item' })

const props = withDefaults(
  defineProps<{
    /** text | bankCard | password | phone | money | digit */
    type?: string
    previewType?: string
    name?: string | number
    title?: string
    brief?: string
    modelValue?: string | number
    placeholder?: string
    maxlength?: string | number
    /** large | normal */
    size?: string
    /** left | center | right */
    align?: string
    error?: string
    readonly?: boolean
    disabled?: boolean
    solid?: boolean
    clearable?: boolean
    isVirtualKeyboard?: boolean
    virtualKeyboardDisorder?: boolean
    virtualKeyboardOkText?: string
    virtualKeyboardVm?: object | string | null
    isTitleLatent?: boolean
    isFormative?: boolean
    isHighlight?: boolean
    isAmount?: boolean
    formation?: (
      name: string | number,
      curValue: string,
      curPos: number,
    ) => FormattedValue | undefined
  }>(),
  {
    type: 'text',
    previewType: '',
    name: undefined,
    title: '',
    brief: '',
    modelValue: '',
    placeholder: '',
    maxlength: '',
    size: 'normal',
    align: 'left',
    error: '',
    readonly: false,
    disabled: false,
    solid: true,
    clearable: false,
    isVirtualKeyboard: false,
    virtualKeyboardDisorder: false,
    virtualKeyboardOkText: undefined,
    virtualKeyboardVm: null,
    isTitleLatent: false,
    isFormative: false,
    isHighlight: false,
    isAmount: false,
    formation: () => undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', name: string | number, value: string): void
  (e: 'focus', name: string | number): void
  (e: 'blur', name: string | number): void
  (e: 'confirm', name: string | number, value: string): void
  (e: 'keyup', name: string | number, event: KeyboardEvent): void
  (e: 'keydown', name: string | number, event: KeyboardEvent): void
}>()

const rootField = inject<{ disabled?: boolean } | null>('rootField', null)
const root = ref<{ $el: HTMLElement }>()
const numberKeyboard = ref<InstanceType<typeof MdNumberKeyboard>>()

const name = props.name ?? randomId('input-item')

const inputValue = ref('')
const inputBindValue = ref('')
const inputNumberKeyboard = ref<InstanceType<typeof MdNumberKeyboard> | { $el?: HTMLElement } | null>(null)
const isInputFocus = ref(false)
const isInputEditing = ref(false)
const isPreview = ref(false)

let stopEditInputTimer: ReturnType<typeof setTimeout> | null = null

const inputItemType = computed(() => (isPreview.value ? props.previewType : props.type) || 'text')
const inputType = computed(() => {
  let type = inputItemType.value || 'text'
  if (type === 'bankCard' || type === 'phone' || type === 'digit') {
    type = 'tel'
  } else if (type === 'money') {
    type = 'text'
  }
  return type
})
const inputMaxLength = computed(() =>
  inputItemType.value === 'phone' ? 11 : (props.maxlength as string | number),
)
const inputPlaceholder = computed(() =>
  props.isTitleLatent && isInputActive.value ? '' : props.placeholder,
)
const isInputActive = computed(() => !isInputEmpty.value || isInputFocus.value)
const isInputEmpty = computed(() => !inputValue.value.length)
const isInputFormative = computed(() => {
  const type = inputItemType.value
  return (
    props.isFormative || type === 'bankCard' || type === 'phone' || type === 'money' || type === 'digit'
  )
})
const isDisabled = computed(() => !!rootField?.disabled || props.disabled)
const hasInputError = computed(() => !!errorSlot.value || props.error !== '')
const hasInputBrief = computed(() => !!briefSlot.value || props.brief !== '')

const slots = useSlots()
const errorSlot = computed(() => !!slots.error)
const briefSlot = computed(() => !!slots.brief)

watch(
  () => props.modelValue,
  val => {
    // Filter out two-way binding
    if (val !== trimValue(inputValue.value, '\\s|,')) {
      inputValue.value = formateValue(subValue(`${val}`)).value
    }
  },
)

watch(
  () => props.previewType,
  val => {
    isPreview.value = !!val
  },
  { immediate: true },
)

watch(inputValue, val => {
  inputBindValue.value = val
  const emitted = isInputFormative.value ? trimValue(val, '\\s|,') : val
  if (emitted !== props.modelValue) {
    emit('update:modelValue', emitted)
    emit('change', name, emitted)
  }
})

watch(isInputFocus, val => {
  if (!props.isVirtualKeyboard || !inputNumberKeyboard.value) {
    return
  }
  const keyboard = inputNumberKeyboard.value as { show?: () => void; hide?: () => void }
  if (val) {
    keyboard.show?.()
    emit('focus', name)
  } else {
    keyboard.hide?.()
    emit('blur', name)
  }
})

inputValue.value = formateValue(subValue(`${props.modelValue}`)).value

onMounted(() => {
  if (props.isVirtualKeyboard) {
    nextTick(() => {
      initNumberKeyBoard()
    })
  }
})

onBeforeUnmount(() => {
  const keyboard = inputNumberKeyboard.value as { $el?: HTMLElement } | null
  if (keyboard?.$el && keyboard.$el.parentNode) {
    keyboard.$el.parentNode.removeChild(keyboard.$el)
  }
  if (stopEditInputTimer) {
    clearTimeout(stopEditInputTimer)
  }
})

function formateValue(curValue: string, curPos = 0): FormattedValue {
  const type = inputItemType.value
  const oldValue = inputValue.value
  const isAdd = oldValue.length > curValue.length ? -1 : 1

  let formateValue: FormattedValue = { value: curValue, range: curPos }

  // no format
  if (!isInputFormative.value || curValue === '') {
    return formateValue
  }

  // custom format by user
  const customValue = props.formation(name, curValue, curPos)
  if (customValue) {
    return customValue
  }

  // default format by component
  let gap = ' '
  switch (type) {
    case 'bankCard': {
      curValue = subValue(trimValue(curValue.replace(/\D/g, '')))
      formateValue = formatValueByGapStep(4, curValue, gap, 'left', curPos, isAdd, oldValue)
      break
    }
    case 'phone': {
      curValue = subValue(trimValue(curValue.replace(/\D/g, '')))
      formateValue = formatValueByGapRule('3|4|4', curValue, gap, curPos, isAdd)
      break
    }
    case 'money': {
      gap = ','
      curValue = subValue(trimValue(curValue.replace(/[^\d.]/g, '')))
      const dotPos = curValue.indexOf('.')
      // format if no dot or new add dot or insert befor dot
      const moneyCurValue = curValue.split('.')[0]
      const moneyCurDecimal = ~dotPos ? `.${curValue.split('.')[1]}` : ''

      formateValue = formatValueByGapStep(
        3,
        trimValue(moneyCurValue, gap),
        gap,
        'right',
        curPos,
        isAdd,
        oldValue.split('.')[0],
      )
      formateValue.value += moneyCurDecimal
      break
    }
    case 'digit': {
      curValue = subValue(trimValue(curValue.replace(/\D/g, '')))
      formateValue.value = curValue
      break
    }
  }

  return formateValue
}

function subValue(val: string): string {
  const len = inputMaxLength.value
  if (len !== '' && len !== undefined) {
    return val.substring(0, Number(len))
  }
  return val
}

function startEditInput() {
  isInputEditing.value = true
  if (stopEditInputTimer) {
    clearTimeout(stopEditInputTimer)
  }
  stopEditInputTimer = setTimeout(() => {
    isInputEditing.value = false
  }, 500)
}

function clearInput() {
  inputValue.value = ''
  !props.isTitleLatent && focus()
  isPreview.value = false
}

function stopPreview() {
  clearInput()
}

function focusFakeInput() {
  isInputFocus.value = true
  setTimeout(() => {
    document.addEventListener('click', blurFakeInput, false)
  }, 0)
}

function blurFakeInput() {
  isInputFocus.value = false
  document.removeEventListener('click', blurFakeInput, false)
}

/**
 * v2 契约（收敛）：virtualKeyboardVm 传入外部键盘实例时仅接管显隐与挂载；
 * enter/delete/confirm 事件由使用方在外部键盘上自行绑定
 * （内置键盘走模板绑定，无需处理）
 */
function initNumberKeyBoard() {
  const kb = (props.virtualKeyboardVm && typeof props.virtualKeyboardVm === 'object'
    ? props.virtualKeyboardVm
    : numberKeyboard.value) as { $el?: HTMLElement } | null

  if (!kb) {
    return
  }

  inputNumberKeyboard.value = kb
  if (kb.$el) {
    document.body.appendChild(kb.$el)
  }
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const formated = formateValue(
    target.value,
    isInputFormative.value ? getCursorsPosition(target) : 0,
  )

  inputValue.value = formated.value
  inputBindValue.value = formated.value

  if (isInputFormative.value) {
    nextTick(() => {
      setCursorsPosition(target, formated.range as number)
    })
  }
}

function onKeyup(event: KeyboardEvent) {
  emit('keyup', name, event)
  if (+event.keyCode === 13 || +event.keyCode === 108) {
    emit('confirm', name, inputValue.value)
  }
}

function onKeydown(event: KeyboardEvent) {
  emit('keydown', name, event)
  if (!(+event.keyCode === 13 || +event.keyCode === 108)) {
    startEditInput()
    isPreview.value && stopPreview()
  }
}

function onFocus() {
  isInputFocus.value = true
  emit('focus', name)
}

function onBlur() {
  setTimeout(() => {
    isInputFocus.value = false
    emit('blur', name)
  }, 100)
}

function onFakeInputClick() {
  if (isDisabled.value || props.readonly) {
    return
  }

  blurFakeInput()

  if (!isInputFocus.value) {
    focusFakeInput()
  }
}

function onNumberKeyBoardEnter(val: string | number) {
  if (isPreview.value) {
    stopPreview()
  }
  if (
    Number(inputMaxLength.value) > 0 &&
    trimValue(inputValue.value, '\\s|,').length >= Number(inputMaxLength.value)
  ) {
    return
  }
  inputValue.value = formateValue(inputValue.value + val).value
  startEditInput()
}

function onNumberKeyBoardDelete() {
  const value = inputValue.value
  if (value === '') {
    return
  }
  inputValue.value = formateValue(value.substring(0, value.length - 1)).value
  startEditInput()
  if (isPreview.value) {
    stopPreview()
  }
}

function onNumberKeyBoardConfirm() {
  emit('confirm', name, inputValue.value)
}

function focus() {
  if (props.isVirtualKeyboard) {
    onFakeInputClick()
  } else {
    root.value?.$el.querySelector<HTMLInputElement>('.md-input-item-input')?.focus()
    setTimeout(() => {
      isInputFocus.value = true
    }, 200)
  }
}

function blur() {
  if (props.isVirtualKeyboard) {
    blurFakeInput()
  } else {
    root.value?.$el.querySelector<HTMLInputElement>('.md-input-item-input')?.blur()
  }
}

function getValue() {
  return inputValue.value
}

defineExpose({ focus, blur, getValue })
</script>
