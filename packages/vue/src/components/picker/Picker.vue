<template>
  <div class="md-picker" :class="{ 'with-popup': !isView }">
    <template v-if="isView">
      <MdPickerColumn
        ref="pickerColumn"
        :data="data"
        :default-value="defaultValue"
        :default-index="defaultIndex"
        :invalid-index="invalidIndex"
        :line-height="lineHeight"
        :keep-index="keepIndex"
        :cols="cols"
        @initialed="emit('initialed')"
        @change="onPickerChange"
      ></MdPickerColumn>
    </template>
    <template v-else>
      <MdPopup
        :model-value="isPickerShow"
        class="inner-popup"
        position="bottom"
        :mask-closable="maskClosable"
        prevent-scroll
        @update:model-value="val => (isPickerShow = val)"
        @before-show="onPickerBeforeShow"
        @show="onPickerShow"
        @hide="onPickerHide"
        @mask-click="onPickerCancel"
      >
        <MdPopupTitleBar
          :title="title"
          :describe="describe"
          :ok-text="okText"
          :cancel-text="cancelText"
          :large-radius="largeRadius"
          @confirm="onPickerConfirm"
          @cancel="onPickerCancel"
        ></MdPopupTitleBar>
        <MdPickerColumn
          ref="pickerColumn"
          :data="data"
          :default-value="getDefaultValue()"
          :default-index="getDefaultIndex()"
          :invalid-index="invalidIndex"
          :line-height="lineHeight"
          :keep-index="keepIndex"
          :cols="cols"
          @initialed="onPickerInitialed"
          @change="onPickerChange"
        ></MdPickerColumn>
      </MdPopup>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { cascade, compareObjects, t } from '@mand-mobile/core'
import MdPopup from '../popup/Popup.vue'
import MdPopupTitleBar from '../popup/PopupTitleBar.vue'
import MdPickerColumn from './PickerColumn.vue'
import type { PickerColumnItem, PickerColumnInstance } from './PickerColumn.vue'

defineOptions({ name: 'md-picker' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    isView?: boolean
    title?: string
    describe?: string
    okText?: string
    cancelText?: string
    maskClosable?: boolean
    lineHeight?: number
    keepIndex?: boolean
    largeRadius?: boolean
    data?: PickerColumnItem[][]
    cols?: number
    defaultValue?: unknown[]
    defaultIndex?: number[]
    invalidIndex?: Array<number | number[]>
    isCascade?: boolean
  }>(),
  {
    modelValue: false,
    isView: false,
    title: '',
    describe: '',
    okText: undefined,
    cancelText: undefined,
    maskClosable: true,
    lineHeight: undefined,
    keepIndex: false,
    largeRadius: false,
    data: () => [],
    cols: 1,
    defaultValue: () => [],
    defaultIndex: () => [],
    invalidIndex: () => [],
    isCascade: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'initialed'): void
  (e: 'confirm', values: Array<PickerColumnItem | undefined>): void
  (e: 'cancel'): void
  (e: 'change', columnIndex: number, itemIndex: number, values: PickerColumnItem[]): void
  (e: 'show'): void
  (e: 'hide'): void
}>()

const okText = props.okText ?? t('md.picker.confirm')
const cancelText = props.cancelText ?? t('md.picker.cancel')
const lineHeight = props.lineHeight ?? 45

const pickerColumn = ref<PickerColumnInstance>()

const isPickerShow = ref(false)
const isPickerFirstPopup = ref(true)
const oldActivedIndexs = ref<number[] | null>(null)

watch(
  () => props.modelValue,
  val => {
    isPickerShow.value = val
    val && initPicker()
  },
)

watch(isPickerShow, val => {
  if (!val) {
    emit('update:modelValue', val)
  }
})

watch(
  () => props.data,
  (val, oldVal) => {
    if (!compareObjects(val, oldVal)) {
      initPickerColumn()
    }
  },
  { deep: true, immediate: true },
)

watch(
  () => props.defaultIndex,
  () => {
    initPickerColumn()
  },
  { deep: true },
)

onMounted(() => {
  initPicker()

  if (props.isView) {
    setTimeout(() => {
      pickerColumn.value?.refresh()
    })
  }
})

function column(): PickerColumnInstance | undefined {
  return pickerColumn.value
}

function initPicker() {
  if (!props.isView && props.modelValue) {
    isPickerShow.value = props.modelValue
  }

  if (isPickerFirstPopup.value) {
    isPickerFirstPopup.value = false
  } else {
    // mark initial activedIndexs as snapshoot
    setTimeout(() => {
      oldActivedIndexs.value = [...(column()?.activedIndexs ?? [])]
    }, 100)
  }
}

function initPickerColumn() {
  if (!props.isCascade) {
    return
  }

  const defaultIndex = getDefaultIndex()
  const defaultValue = getDefaultValue()
  setTimeout(() => {
    const col = column()
    if (!col) {
      return
    }
    cascade(col, {
      currentLevel: -1,
      maxLevel: props.cols,
      values: props.data || [],
      defaultIndex,
      defaultValue,
    })
  })
}

function resetPickerColumn() {
  initPickerColumn()
}

function getDefaultIndex() {
  return oldActivedIndexs.value || props.defaultIndex
}

function getDefaultValue() {
  return oldActivedIndexs.value ? [] : props.defaultValue
}

function onPickerConfirm() {
  const col = column()
  if (!col) {
    return
  }
  const columnValues = col.getColumnValues()
  let isScrolling = false
  col.scrollers.forEach(scroller => {
    if (
      (scroller as unknown as { _isAnimating?: boolean })._isAnimating !== false ||
      (scroller as unknown as { _isDecelerating?: boolean })._isDecelerating !== false ||
      (scroller as unknown as { _isDragging?: boolean })._isDragging !== false ||
      (scroller as unknown as { _isGesturing?: boolean })._isGesturing !== false
    ) {
      isScrolling = true
    }
  })

  if (!isScrolling) {
    isPickerShow.value = false
    emit('confirm', columnValues)
  }
}

function onPickerInitialed() {
  emit('initialed')
}

function onPickerCancel() {
  isPickerShow.value = false
  emit('cancel')

  // reset picker by snapshot
  setTimeout(() => {
    resetPickerColumn()
    column()?.refresh()
  })
}

function onPickerChange(columnIndex: number, itemIndex: number, values: PickerColumnItem[]) {
  if (props.isCascade) {
    const col = column()
    if (col) {
      cascade(
        col,
        {
          currentLevel: columnIndex,
          maxLevel: props.cols,
          values,
        },
        () => {
          // reinitiate columns after the changing column
          col.refresh(undefined, columnIndex + 1)
        },
      )
    }
  }
  emit('change', columnIndex, itemIndex, values)
}

function onPickerBeforeShow() {
  if (!column()?.isScrollInitialed) {
    setTimeout(() => {
      column()?.refresh()
    })
  }
}

function onPickerHide() {
  emit('hide')
}

function onPickerShow() {
  emit('show')
}

function refresh(callback?: () => void, startIndex?: number) {
  const col = column()
  if (!col) {
    return
  }
  /**
   * Manual call 'column.refresh' only when picker is in-view or popup is show,
   * otherwise 'column.refresh' will be called at popup's 'onBerforeShow' automatically
   */
  if (props.isView || isPickerShow.value) {
    col.refresh(callback, startIndex)
  }
}

function getColumnValues() {
  return column()?.getColumnValues() ?? []
}

function getColumnIndex(index = 0) {
  return column()?.getColumnIndex(index)
}

function getColumnIndexs() {
  return column()?.getColumnIndexs() ?? []
}

defineExpose({ refresh, getColumnValues, getColumnIndex, getColumnIndexs })
</script>
