<template>
  <div class="md-number-keyboard-container" :class="[type, disabled ? 'disabled' : '']">
    <div class="keyboard-number">
      <ul class="keyboard-number-list">
        <MdKeyboardKey
          v-for="n in 9"
          :key="n - 1"
          class="keyboard-number-item"
          :value="keyNumberList[n - 1]"
          @press="onNumberKeyClick"
        ></MdKeyboardKey>
        <template v-if="type === 'professional'">
          <MdKeyboardKey
            v-if="!hideDot"
            class="keyboard-number-item"
            :value="duplicateZero ? zeroValue : dotText"
            @press="onNumberKeyClick"
          ></MdKeyboardKey>
          <MdKeyboardKey
            class="keyboard-number-item"
            :class="{ 'large-item': hideDot }"
            :value="duplicateZero ? duplicateZeroValue : keyNumberList[9]"
            @press="onNumberKeyClick"
          ></MdKeyboardKey>
          <MdKeyboardKey
            v-if="duplicateZero"
            class="keyboard-number-item"
            :value="dotText"
            @press="onNumberKeyClick"
          ></MdKeyboardKey>
          <template v-if="!duplicateZero">
            <li v-if="isView" class="keyboard-number-item"></li>
            <MdKeyboardKey
              v-else
              class="keyboard-number-item slidedown"
              no-touch
              no-prevent
              @press="onSlideDoneClick"
            ></MdKeyboardKey>
          </template>
        </template>
        <template v-else>
          <li class="keyboard-number-item no-bg"></li>
          <MdKeyboardKey
            class="keyboard-number-item"
            :value="keyNumberList[9]"
            @press="onNumberKeyClick"
          ></MdKeyboardKey>
          <MdKeyboardKey
            class="keyboard-number-item no-bg delete"
            @press="onDeleteClick"
          ></MdKeyboardKey>
        </template>
      </ul>
    </div>
    <div v-if="type === 'professional'" class="keyboard-operate">
      <ul class="keyboard-operate-list">
        <MdKeyboardKey class="keyboard-operate-item delete" @press="onDeleteClick"></MdKeyboardKey>
        <MdKeyboardKey
          class="keyboard-operate-item confirm"
          :value="okText"
          no-touch
          no-prevent
          @press="onConfirmeClick"
        ></MdKeyboardKey>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { t } from '@mand-mobile/core'
import MdKeyboardKey from './KeyboardKey.vue'

defineOptions({ name: 'md-number-keyboard-container' })

const props = withDefaults(
  defineProps<{
    /** simple | professional */
    type?: string
    disorder?: boolean
    hideDot?: boolean
    okText?: string
    isView?: boolean
    textRender?: (val: string | number) => string | number | undefined
    disabled?: boolean
    duplicateZero?: boolean
  }>(),
  {
    type: 'professional',
    disorder: false,
    hideDot: false,
    okText: undefined,
    isView: false,
    textRender: () => undefined,
    disabled: false,
    duplicateZero: false,
  },
)

const emit = defineEmits<{
  (e: 'enter', value: string | number): void
  (e: 'delete'): void
  (e: 'confirm'): void
  (e: 'hide'): void
}>()

const okText = props.okText ?? t('md.number_keyboard.confirm')

const keyNumberList = ref<Array<string | number>>([])

const dotText = computed(() => props.textRender('.') || '.')
const duplicateZeroValue = computed(() => props.textRender('00') || '00')
const zeroValue = computed(() => props.textRender('0') || '0')

generateKeyNumber()

function generateKeyNumber() {
  const baseStack = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
  const baseStackTmp = [...baseStack]
  keyNumberList.value = baseStack.map((item) => {
    const val = props.disorder
      ? (baseStackTmp.splice(parseInt(`${Math.random() * baseStackTmp.length}`), 1)[0] ?? 0)
      : item
    return props.textRender(val) || val
  })
}

function onNumberKeyClick(val: string | number) {
  if (props.disabled) {
    return
  }
  emit('enter', val)
}

function onDeleteClick() {
  if (props.disabled) {
    return
  }
  emit('delete')
}

function onConfirmeClick() {
  if (props.disabled) {
    return
  }
  emit('confirm')
}

function onSlideDoneClick() {
  emit('hide')
}
</script>
