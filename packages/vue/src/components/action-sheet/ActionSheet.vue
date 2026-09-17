<template>
  <div class="md-action-sheet">
    <MdPopup
      class="inner-popup large-radius"
      :model-value="isActionSheetShow"
      position="bottom"
      prevent-scroll
      @update:model-value="onPopupInput"
      @show="onShow"
      @hide="onHide"
    >
      <div class="md-action-sheet-content">
        <header v-if="title" class="md-action-sheet-header">{{ title }}</header>
        <ul class="md-action-sheet-list">
          <template v-for="(item, index) in options" :key="index">
            <li
              :class="{
                active: index === clickIndex,
                disabled: index === invalidIndex,
                'md-action-sheet-item': true,
              }"
              @click="onSelect(item, index)"
            >
              <div class="md-action-sheet-item-wrapper">
                <div class="md-action-sheet-item-section" v-html="item.text || item.label"></div>
              </div>
            </li>
          </template>
          <li class="md-action-sheet-cancel" @click="onCancel">{{ cancelText }}</li>
        </ul>
      </div>
    </MdPopup>
  </div>
</template>

<script lang="ts">
export interface ActionSheetOption {
  text?: string
  label?: string
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { inArray, t } from '@mand-mobile/core'
import MdPopup from '../popup/Popup.vue'

defineOptions({ name: 'md-action-sheet' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    options?: ActionSheetOption[]
    defaultIndex?: number
    invalidIndex?: number | number[]
    cancelText?: string
    maxHeight?: number
  }>(),
  {
    modelValue: false,
    title: '',
    options: () => [],
    defaultIndex: -1,
    invalidIndex: -1,
    cancelText: undefined,
    maxHeight: 400,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'show'): void
  (e: 'hide'): void
  (e: 'selected', option: ActionSheetOption): void
  (e: 'cancel'): void
}>()

const cancelText = props.cancelText ?? t('md.action_sheet.cancel')

const isActionSheetShow = ref(props.modelValue)
const clickIndex = ref(props.defaultIndex)

watch(
  () => props.modelValue,
  (newVal) => {
    isActionSheetShow.value = newVal
  },
)

function onPopupInput(val: boolean) {
  if (!val) {
    hideSheet()
  }
}

function onShow() {
  emit('show')
}

function onHide() {
  emit('hide')
  hideSheet()
}

function onSelect(item: ActionSheetOption, index: number) {
  if (index === props.invalidIndex || inArray(props.invalidIndex, index)) {
    return
  }
  clickIndex.value = index
  emit('selected', item)
  hideSheet()
}

function onCancel() {
  emit('cancel')
  hideSheet()
}

function hideSheet() {
  isActionSheetShow.value = false
  emit('update:modelValue', false)
}
</script>
