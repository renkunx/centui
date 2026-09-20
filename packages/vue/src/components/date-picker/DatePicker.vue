<template>
  <div class="cu-date-picker" :class="[type]">
    <CuPicker
      ref="picker"
      :model-value="modelValue"
      :is-view="isView"
      :title="title"
      :describe="describe"
      :ok-text="okText"
      :cancel-text="cancelText"
      :mask-closable="maskClosable"
      :line-height="lineHeight"
      :keep-index="keepIndex"
      :large-radius="largeRadius"
      :data="columnData"
      :cols="columnData.length"
      :default-value="columnDataDefault"
      @update:model-value="(val) => emit('update:modelValue', val)"
      @initialed="onPickerInitialed"
      @change="onPickerChange"
      @confirm="onPickerConfirm"
      @cancel="onPickerCancel"
      @show="onPickerShow"
      @hide="onPickerHide"
    ></CuPicker>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { warn } from '@centui/core'
import {
  buildDateColumns,
  formatDate,
  type DateColumnGenerator,
  type DateColumnItem,
  type DatePickerColumnOptions,
  type PrevColumnRef,
} from '@centui/core'
import CuPicker from '../picker/Picker.vue'
import type { PickerColumnItem } from '../picker/PickerColumn.vue'

defineOptions({ name: 'cu-date-picker' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /** date | time | datetime | custom */
    type?: DatePickerColumnOptions['type']
    /** type=custom 时的列类型序列 */
    customTypes?: NonNullable<DatePickerColumnOptions['customTypes']>
    minDate?: Date
    maxDate?: Date
    defaultDate?: Date
    minuteStep?: number
    unitText?: string[]
    todayText?: string
    textRender?: DatePickerColumnOptions['textRender']
    isView?: boolean
    title?: string
    describe?: string
    okText?: string
    cancelText?: string
    maskClosable?: boolean
    lineHeight?: number
    keepIndex?: boolean
    largeRadius?: boolean
  }>(),
  {
    modelValue: false,
    type: 'date',
    customTypes: undefined,
    minDate: undefined,
    maxDate: undefined,
    defaultDate: undefined,
    minuteStep: 1,
    unitText: undefined,
    todayText: undefined,
    textRender: undefined,
    isView: false,
    title: '',
    describe: '',
    okText: undefined,
    cancelText: undefined,
    maskClosable: true,
    lineHeight: undefined,
    keepIndex: false,
    largeRadius: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'initialed'): void
  (e: 'change', columnIndex: number, itemIndex: number, value: PickerColumnItem): void
  (e: 'confirm', columnsValue: DateColumnItem[]): void
  (e: 'cancel'): void
  (e: 'show'): void
  (e: 'hide'): void
}>()

const picker = ref<InstanceType<typeof CuPicker>>()

const columnData = ref<DateColumnItem[][]>([])
const columnDataDefault = ref<Array<string | number>>([])
const columnDataGenerator = ref<DateColumnGenerator[]>([])
const oldColumnData = ref<DateColumnItem[][] | null>(null)

function coreOptions(): DatePickerColumnOptions {
  return {
    type: props.type,
    customTypes: props.customTypes,
    minDate: props.minDate,
    maxDate: props.maxDate,
    defaultDate: props.defaultDate,
    minuteStep: props.minuteStep,
    unitText: props.unitText,
    todayText: props.todayText,
    textRender: props.textRender,
  }
}

watch(
  () => [props.type, props.minDate, props.maxDate, props.defaultDate, props.minuteStep] as const,
  () => {
    initPickerColumn()
  },
)

onMounted(() => {
  initPickerColumn()
})

function initPickerColumn() {
  const { generators, defaults, columns } = buildDateColumns(coreOptions())
  columnDataGenerator.value = generators
  columnDataDefault.value = defaults
  columnData.value = columns
  picker.value?.refresh()
}

/**
 * 从 columnIndex 起按当前各列选中值重建后续列（v2 $_initColumnData）
 */
function initColumnData(columnIndex: number, defaultDate: number[] = []) {
  const columnDataList = columnData.value
  const generatorList = columnDataGenerator.value
  for (let i = columnIndex, len = generatorList.length; i < len; i++) {
    // Collect parameters for columnDataGenerator
    const columnDataGeneratorParams: PrevColumnRef[] = []
    const generator = generatorList[i]
    for (let j = 0; j < i; j++) {
      const _generator = generatorList[j]
      if (defaultDate[j] && _generator) {
        columnDataGeneratorParams.push({
          type: _generator.type,
          value: defaultDate[j],
        })
        continue
      }

      const itemIndex = picker.value?.getColumnIndex(j) ?? 0
      if (columnDataList[j]) {
        const picked = pickerValueOf(j, itemIndex)
        columnDataGeneratorParams.push(picked ?? '')
      } else {
        columnDataGeneratorParams.push('')
        warn(`DatePicker columnData of index ${j} is void`)
      }
    }

    // Generator colume data with columnDataGeneratorParams
    const curColumnData = generator ? generator(...columnDataGeneratorParams) : []

    columnData.value[i] = curColumnData
  }
}

function pickerValueOf(columnIndex: number, _itemIndex: number): DateColumnItem | undefined {
  // 经 Picker 的暴露 API 读取当前列选中项
  const values = picker.value?.getColumnValues() ?? []
  return values[columnIndex] as DateColumnItem | undefined
}

function onPickerInitialed() {
  emit('initialed')
}

function onPickerChange(columnIndex: number, itemIndex: number, value: PickerColumnItem) {
  emit('change', columnIndex, itemIndex, value)

  if (columnIndex < columnData.value.length - 1) {
    initColumnData(columnIndex + 1)
  }
}

function onPickerConfirm(columnsValue: Array<PickerColumnItem | undefined>) {
  emit('confirm', columnsValue as DateColumnItem[])
}

function onPickerCancel() {
  emit('cancel')
  // 恢复打开前的列数据快照
  setTimeout(() => {
    if (oldColumnData.value) {
      columnData.value = [...oldColumnData.value]
      picker.value?.refresh()
    }
  })
}

function onPickerShow() {
  oldColumnData.value = [...columnData.value]
  emit('show')
}

function onPickerHide() {
  emit('hide')
}

/**
 * 将列选中值格式化为日期字符串（默认 yyyy-MM-dd hh:mm）
 */
function getFormatDate(format = 'yyyy-MM-dd hh:mm') {
  return formatDate((picker.value?.getColumnValues() ?? []) as DateColumnItem[], format)
}

defineExpose({ getFormatDate })
</script>
