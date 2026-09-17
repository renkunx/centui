<template>
  <div ref="root" class="md-number-keyboard" :class="{ 'in-view': isView }">
    <template v-if="isView">
      <div v-if="$slots.default" class="md-number-keyboard-slot">
        <slot></slot>
      </div>
      <MdKeyboardBoard
        ref="keyboard"
        :type="type"
        :disorder="disorder"
        :ok-text="okText"
        :is-view="isView"
        :hide-dot="hideDot"
        :text-render="textRender"
        :disabled="disabled"
        :duplicate-zero="duplicateZero"
        @enter="onEnter"
        @delete="onDelete"
        @confirm="onConfirm"
        @hide="isKeyboardShow = false"
      ></MdKeyboardBoard>
    </template>
    <template v-else>
      <MdPopup
        :model-value="isKeyboardShow"
        position="bottom"
        :has-mask="false"
        @update:model-value="onPopupInput"
        @show="emit('show')"
        @hide="emit('hide')"
      >
        <div v-if="$slots.default" class="md-number-keyboard-slot">
          <slot></slot>
        </div>
        <MdKeyboardBoard
          ref="keyboard"
          :type="type"
          :disorder="disorder"
          :ok-text="okText"
          :is-view="isView"
          :hide-dot="hideDot"
          :text-render="textRender"
          :disabled="disabled"
          :duplicate-zero="duplicateZero"
          @enter="onEnter"
          @delete="onDelete"
          @confirm="onConfirm"
          @hide="isKeyboardShow = false"
          @touchmove.prevent
        ></MdKeyboardBoard>
      </MdPopup>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import MdPopup from '../popup/Popup.vue'
import MdKeyboardBoard from './KeyboardBoard.vue'

defineOptions({ name: 'md-number-keyboard' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /** simple | professional */
    type?: string
    isView?: boolean
    hideDot?: boolean
    disorder?: boolean
    isHideConfirm?: boolean
    disabled?: boolean
    okText?: string
    textRender?: (val: string | number) => string | number | undefined
    duplicateZero?: boolean
  }>(),
  {
    modelValue: false,
    type: undefined,
    isView: false,
    hideDot: false,
    disorder: false,
    isHideConfirm: true,
    disabled: false,
    okText: undefined,
    textRender: undefined,
    duplicateZero: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'enter', value: string | number): void
  (e: 'delete'): void
  (e: 'confirm'): void
  (e: 'show'): void
  (e: 'hide'): void
}>()

const root = ref<HTMLElement>()
const isKeyboardShow = ref(false)

watch(
  () => props.modelValue,
  val => {
    isKeyboardShow.value = val
  },
)

watch(isKeyboardShow, val => {
  emit('update:modelValue', val)
})

onMounted(() => {
  props.modelValue && (isKeyboardShow.value = props.modelValue)
})

function onPopupInput(val: boolean) {
  isKeyboardShow.value = val
}

function onEnter(val: string | number) {
  emit('enter', val)
}

function onDelete() {
  emit('delete')
}

function onConfirm() {
  emit('confirm')
  props.isHideConfirm && hide()
}

function show() {
  isKeyboardShow.value = true
}

function hide() {
  isKeyboardShow.value = false
}

defineExpose({ show, hide, $el: root })
</script>
