<template>
  <div
    ref="root"
    class="md-picker-column"
    :style="{ height: `${style.indicatorHeight + 2 * style.maskerHeight}px` }"
  >
    <div class="md-picker-column-container">
      <div class="md-picker-column-masker top" :style="{ height: `${style.maskerHeight}px` }"></div>
      <div
        class="md-picker-column-masker bottom"
        :style="{ height: `${style.maskerHeight}px` }"
      ></div>
      <div class="md-picker-column-list">
        <div v-for="(colunm, i) in columnValues" :key="i" class="md-picker-column-item">
          <ul class="column-list" :style="{ 'padding-top': `${style.maskerHeight}px` }">
            <li
              v-for="(item, j) in colunm"
              :key="j"
              class="column-item"
              :class="{
                active: isColumnIndexActive(i, j),
                disabled: isColumnIndexInvalid(i, j),
              }"
              :style="{
                height: `${style.indicatorHeight}px`,
                'line-height': `${style.indicatorHeight}px`,
              }"
              v-text="item.text || item.label"
            ></li>
          </ul>
        </div>
        <template v-if="cols">
          <div
            v-for="n in cols - columnValues.length"
            :key="n + columnValues.length - 1"
            class="md-picker-column-item"
          >
            <ul class="column-list" :style="{ 'padding-top': `${style.maskerHeight}px` }"></ul>
          </div>
        </template>
      </div>
      <div class="md-picker-column-hooks">
        <template v-if="cols">
          <div
            v-for="n in cols"
            :key="n - 1"
            class="md-picker-column-hook"
            @touchstart="onColumnTouchStart($event, n - 1)"
            @mousedown="onColumnTouchStart($event, n - 1, true)"
            @touchmove="onColumnTouchMove($event, n - 1)"
            @mousemove="onColumnTouchMove($event, n - 1, true)"
            @touchend="onColumnTouchEnd($event, n - 1)"
            @mouseup="onColumnTouchEnd($event, n - 1, true)"
          ></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue'
import { inArray, traverse, warn, type TraverseNode } from '@mand-mobile/core'
import { getDpr, render, Scroller, type Scroller as ScrollerType } from '@mand-mobile/core/web'

defineOptions({ name: 'md-picker-column' })

const props = withDefaults(
  defineProps<{
    data?: PickerColumnItem[][]
    cols?: number
    defaultValue?: unknown[]
    defaultIndex?: number[]
    invalidIndex?: Array<number | number[]>
    lineHeight?: number
    keepIndex?: boolean
  }>(),
  {
    data: () => [],
    cols: 1,
    defaultValue: () => [],
    defaultIndex: () => [],
    invalidIndex: () => [],
    lineHeight: 45,
    keepIndex: false,
  },
)

const emit = defineEmits<{
  (e: 'initialed'): void
  (e: 'change', columnIndex: number, itemIndex: number, value: PickerColumnItem): void
}>()

const dpr = getDpr()

const root = ref<HTMLElement>()

const columnValues = ref<PickerColumnItem[][]>([])
// 命令式实例表：不入响应式（ref 深解包会剥离 class 私有字段同一性）
const scrollers: ScrollerType[] = []
const scrollDirect = ref(1)
const scrollPosition = ref(0)
const activedIndexs = ref<number[]>([])
const isInitialed = ref(false)
const isScrollInitialed = ref(false)
const isMouseDown = ref(false)

const style = computed(() => ({
  maskerHeight: (props.lineHeight * 2 + 10) * dpr,
  indicatorHeight: props.lineHeight * dpr,
}))

watch(
  () => props.data,
  (val) => {
    columnValues.value = [...val]
  },
  { deep: true },
)

onBeforeMount(() => {
  columnValues.value = [...props.data]
})

function hooks(): HTMLElement[] {
  if (!root.value) {
    return []
  }
  return Array.from(root.value.querySelectorAll<HTMLElement>('.md-picker-column-hook'))
}

// initial scroller for each column
function initColumnsScroller(startIndex = 0) {
  const hookList = hooks()
  for (let i = startIndex, len = hookList.length; i < len; i++) {
    const container = hookList[i]
    container && initSingleColumnScroller(container, i)
  }

  // initial index only refresh all columns
  if (!startIndex) {
    initColumnIndex()
    if (!isInitialed.value) {
      isInitialed.value = true
      setTimeout(() => {
        emit('initialed')
      }, 0)
    }
  }

  isScrollInitialed.value = true
}

// initial scroller for column by index
function initSingleColumnScroller(container: HTMLElement, index: number) {
  if (!root.value) {
    return
  }
  const columns = root.value.querySelectorAll<HTMLElement>('.column-list')
  const content = columns[index]

  if (index === undefined || !columns || !container || !content) {
    return
  }

  const rect = container.getBoundingClientRect()
  const scroller = new Scroller(
    (left, top) => {
      render(content, left, top)
    },
    {
      scrollingX: false,
      snapping: true,
      snappingVelocity: 1,
      animationDuration: 350,
      scrollingComplete: () => {
        onColumnScrollEnd(index)
      },
    },
  )

  // set scroller size
  scroller.setPosition(rect.left + container.clientLeft, rect.top + container.clientTop)
  scroller.setDimensions(
    container.clientWidth,
    container.clientHeight,
    content.offsetWidth,
    content.offsetHeight + style.value.maskerHeight,
  )
  scroller.setSnapSize(0, style.value.indicatorHeight)

  // save scroller instance
  scrollers[index] = scroller

  // reset scrolling position
  resetScrollingPosition(index)
}

// each column scroll to active item by defaultIndex
function initColumnIndex() {
  const data = columnValues.value
  const scrollerList = scrollers

  getColumnIndexByDefault(
    data,
    props.defaultIndex,
    props.defaultValue,
    (columnIndex, itemIndex) => {
      const scroller = scrollerList[columnIndex]

      if (!scroller) {
        warn(`initialColumnIndex: scroller of column ${columnIndex} is undefined`)
        return
      }

      /**
       * If the initial selection item is invalid,
       * then a valid item is automatically selected
       */
      if (isColumnIndexInvalid(columnIndex, itemIndex)) {
        scrollToValidIndex(scroller, columnIndex, itemIndex)
      } else {
        scrollToIndex(scroller, columnIndex, itemIndex)
        activedIndexs.value[columnIndex] = itemIndex
      }
    },
  )
}

function getColumnIndexByDefault(
  data: PickerColumnItem[][],
  defaultIndex: number[] = [],
  defaultValue: unknown[],
  fn: (columnIndex: number, itemIndex: number) => void | number = () => {},
) {
  if (!data) {
    return
  }

  traverse(data as unknown as TraverseNode[], (item, _level, indexs) => {
    const columnIndex = indexs[0]
    const itemIndex = indexs[1]
    let itemDefaultIndex = defaultIndex[columnIndex]
    const itemDefaultValue = defaultValue[columnIndex]

    /*
     * given a default itemIndex when both defaultIndex & defaultValue are undefined
     * avoid activieIndexs failing to initialize
     */
    if (itemDefaultIndex === undefined && itemDefaultValue === undefined) {
      itemDefaultIndex = 0
    }

    // get initial itemIndex of each columnIndex by defaultIndex or defaultValue
    if (
      (itemDefaultIndex !== undefined && itemIndex === itemDefaultIndex) ||
      (itemDefaultValue !== undefined &&
        (item.text === itemDefaultValue ||
          item.label === itemDefaultValue ||
          item.value === itemDefaultValue))
    ) {
      fn(columnIndex, itemIndex)
      return 2
    }
  })
}

function getColumnIndexByOffset(top: number) {
  return Math.round(top / style.value.indicatorHeight)
}

function getColumnOffsetByIndex(index: number) {
  return index * style.value.indicatorHeight
}

function isColumnIndexActive(columnIndex: number, itemIndex: number) {
  return activedIndexs.value[columnIndex] === itemIndex
}

function isColumnIndexInvalid(columnIndex: number, itemIndex: number) {
  const invalidIndex = props.invalidIndex[columnIndex]
  return inArray(invalidIndex as number | number[], itemIndex)
}

function hasValidIndex(columnIndex: number) {
  for (const key of props.data[columnIndex].keys()) {
    if (!isColumnIndexInvalid(columnIndex, key)) {
      return true
    }
  }
  warn(`hasValidIndex: has no valid items in column index ${columnIndex}`)
  return false
}

function findValidIndex(columnIndex: number, count: number): number {
  // Has no valid items
  if (!hasValidIndex(columnIndex)) {
    return count
  }
  let tempCount = count
  while (isColumnIndexInvalid(columnIndex, tempCount)) {
    tempCount += scrollDirect.value
  }
  /**
   * No valid item in this direction,
   * find valid item in another direction
   */
  if (tempCount < 0 || tempCount > props.data[columnIndex].length - 1) {
    scrollDirect.value = -scrollDirect.value
    return findValidIndex(columnIndex, count)
  }
  return tempCount
}

function resetScrollingPosition(columnIndex: number) {
  const scroller = scrollers[columnIndex]
  const columnValue = columnValues.value[columnIndex] || []
  let oldColumnActiveIndex = activedIndexs.value[columnIndex] || 0

  if (!scroller || !oldColumnActiveIndex) {
    return
  }

  if (oldColumnActiveIndex > columnValue.length - 1) {
    oldColumnActiveIndex = columnValue.length - 1
  }

  scrollToIndex(scroller, columnIndex, oldColumnActiveIndex)
  activedIndexs.value[columnIndex] = oldColumnActiveIndex
}

function scrollToIndex(scroller: ScrollerType, _columnIndex: number, itemIndex: number) {
  const offsetTop = getColumnOffsetByIndex(itemIndex)
  scroller.scrollTo(0, offsetTop)
}

function scrollToValidIndex(scroller: ScrollerType, columnIndex: number, itemIndex: number) {
  const count = findValidIndex(columnIndex, itemIndex)
  const offsetTop = getColumnOffsetByIndex(count)
  scroller.scrollTo(0, scrollInZoon(scroller, offsetTop), true)
}

function scrollInZoon(scroller: ScrollerType, top: number) {
  const MaxTop = scroller.getScrollMax().top

  if (top < 0) {
    return 0
  } else if (top > MaxTop) {
    return MaxTop
  } else {
    return top
  }
}

// MARK: events handler
function onColumnTouchStart(event: TouchEvent | MouseEvent, index: number, isMouse = false) {
  event.preventDefault()

  const scroller = scrollers[index]
  const touches = isMouse
    ? [{ pageX: (event as MouseEvent).pageX, pageY: (event as MouseEvent).pageY }]
    : Array.from((event as TouchEvent).touches)

  if (!scroller) {
    warn(`touchstart: scroller of column ${index} is undefined`)
    return
  }

  scrollPosition.value = isMouse
    ? (event as MouseEvent).pageY
    : (event as TouchEvent).touches[0].pageY

  scroller.doTouchStart(touches, event.timeStamp)
  isMouse && (isMouseDown.value = true)
}

function onColumnTouchMove(event: TouchEvent | MouseEvent, index: number, isMouse = false) {
  const scroller = scrollers[index]
  const touches = isMouse
    ? [{ pageX: (event as MouseEvent).pageX, pageY: (event as MouseEvent).pageY }]
    : Array.from((event as TouchEvent).touches)

  if (!scroller || (isMouse && !isMouseDown.value)) {
    return
  }

  const diff =
    scrollPosition.value -
    (isMouse ? (event as MouseEvent).pageY : (event as TouchEvent).touches[0].pageY)
  scrollDirect.value = diff ? diff / Math.abs(diff) : 1

  scroller.doTouchMove(touches, event.timeStamp)
  isMouse && (isMouseDown.value = true)
}

function onColumnTouchEnd(event: TouchEvent | MouseEvent, index: number, isMouse = false) {
  const scroller = scrollers[index]

  if (!scroller || (isMouse && !isMouseDown.value)) {
    return
  }

  scroller.doTouchEnd(event.timeStamp)
  isMouse && (isMouseDown.value = false)
}

function onColumnScrollEnd(index: number) {
  const scroller = scrollers[index]
  if (!scroller) {
    return
  }
  const top = scroller.getValues().top
  const scrollTop = scrollInZoon(scroller, top)
  const activeItemIndex = getColumnIndexByOffset(scrollTop)
  const isInvalid = isColumnIndexInvalid(index, activeItemIndex)

  if (isInvalid || activeItemIndex === activedIndexs.value[index]) {
    isInvalid && scrollToValidIndex(scroller, index, activeItemIndex)
    if (activeItemIndex === activedIndexs.value[index]) {
      scrollToIndex(scroller, index, activeItemIndex)
    }
    return
  }

  activedIndexs.value[index] = activeItemIndex
  emit('change', index, activeItemIndex, getColumnValue(index) as PickerColumnItem)
}

// MARK: public methods
function getColumnValue(index = 0): PickerColumnItem | undefined {
  const activeValues = getColumnValues()
  return activeValues[index]
}

function getColumnValues(): PickerColumnItem[] {
  const data = columnValues.value
  const activeIndexs = activedIndexs.value
  const activeValues: PickerColumnItem[] = []

  data.forEach((item, index) => {
    activeValues[index] = item[activeIndexs[index]]
  })

  return activeValues
}

function getColumnIndex(index = 0) {
  return activedIndexs.value[index]
}

function getColumnIndexs() {
  return activedIndexs.value
}

function setColumnValues(
  index: number,
  values: PickerColumnItem[],
  callback: (instance?: unknown) => void = () => {},
) {
  if (index === undefined || values === undefined) {
    return
  }

  // reset active index
  if (!props.keepIndex) {
    activedIndexs.value[index] = 0
  }

  columnValues.value[index] = values
  nextTick(() => {
    callback()
  })
}

function refresh(callback?: () => void, startIndex = 0) {
  nextTick(() => {
    initColumnsScroller(startIndex)
    callback && callback()
  })
}

defineExpose({
  refresh,
  getColumnValue,
  getColumnValues,
  getColumnIndex,
  getColumnIndexs,
  getColumnIndexByDefault,
  setColumnValues,
  isScrollInitialed,
  activedIndexs,
  scrollers,
})
</script>

<script lang="ts">
import type { ComponentPublicInstance } from 'vue'

export interface PickerColumnItem {
  text?: string
  label?: string
  value?: unknown
}

// v2 契约：向 Picker 实例透传列 API（refresh 由 Picker 自持同名方法，跳过）
export const PICKER_COLUMN_API_LIST = [
  'getColumnValue',
  'getColumnValues',
  'getColumnIndex',
  'getColumnIndexs',
  'getColumnIndexByDefault',
  'setColumnValues',
  'inheritPickerApi',
] as const

export type PickerColumnInstance = ComponentPublicInstance & {
  getColumnValue: (index?: number) => PickerColumnItem | undefined
  getColumnValues: () => PickerColumnItem[]
  getColumnIndex: (index?: number) => number | undefined
  getColumnIndexs: () => number[]
  getColumnIndexByDefault: (
    data: PickerColumnItem[][],
    defaultIndex?: number[],
    defaultValue?: unknown[],
    fn?: (columnIndex: number, itemIndex: number) => void | number,
  ) => void
  setColumnValues: (index: number, values: PickerColumnItem[], callback?: () => void) => void
  refresh: (callback?: () => void, startIndex?: number) => void
  isScrollInitialed: boolean
  activedIndexs: number[]
  scrollers: ScrollerType[]
}
</script>
