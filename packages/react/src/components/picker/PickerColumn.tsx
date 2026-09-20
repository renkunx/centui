import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { inArray, traverse, warn, type TraverseNode } from '@centui/core'
import { getDpr, render, Scroller, type Scroller as ScrollerType } from '@centui/core/web'

export interface PickerColumnItem {
  text?: string
  label?: string
  value?: unknown
  [key: string]: unknown
}

const dpr = getDpr()

export interface PickerColumnProps {
  data?: PickerColumnItem[][]
  cols?: number
  defaultValue?: unknown[]
  defaultIndex?: number[]
  invalidIndex?: Array<number | number[]>
  lineHeight?: number
  keepIndex?: boolean
  onInitialed?: () => void
  onChange?: (columnIndex: number, itemIndex: number, value: PickerColumnItem) => void
}

export interface PickerColumnExposed {
  refresh: (callback?: () => void, startIndex?: number) => void
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
}

export const CuPickerColumn = forwardRef<PickerColumnExposed, PickerColumnProps>(
  function CuPickerColumn(
    {
      data = [],
      cols = 1,
      defaultValue = [],
      defaultIndex = [],
      invalidIndex = [],
      lineHeight = 45,
      keepIndex = false,
      onInitialed,
      onChange,
    }: PickerColumnProps,
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null)
    const columnValuesRef = useRef<PickerColumnItem[][]>([...data])
    const scrollersRef = useRef<ScrollerType[]>([])
    const scrollDirectRef = useRef(1)
    const scrollPositionRef = useRef(0)
    const activedIndexsRef = useRef<number[]>([])
    const isInitialedRef = useRef(false)
    const isMouseDownRef = useRef(false)
    const [, forceRender] = useState(0)
    const lineHeightRef = useRef(lineHeight)
    lineHeightRef.current = lineHeight

    const style = {
      maskerHeight: (lineHeightRef.current * 2 + 10) * dpr,
      indicatorHeight: lineHeightRef.current * dpr,
    }

    // Vue 响应式等价：activedIndexs 变更需触发重渲染（渲染读取该 ref）
    const setActiveIndex = (columnIndex: number, itemIndex: number) => {
      if (activedIndexsRef.current[columnIndex] === itemIndex) {
        return
      }
      activedIndexsRef.current[columnIndex] = itemIndex
      forceRender(n => n + 1)
    }

    const hooks = (): HTMLElement[] => {
      if (!rootRef.current) {
        return []
      }
      return Array.from(rootRef.current.querySelectorAll<HTMLElement>('.cu-picker-column-hook'))
    }

    // v2 契约：data 变化浅拷贝重建列
    useEffect(() => {
      columnValuesRef.current = [...data]
      forceRender(n => n + 1)
    }, [data])

    const getColumnIndexByDefault = (
      columnData: PickerColumnItem[][],
      defIndex: number[] = [],
      defValue: unknown[] = [],
      fn: (columnIndex: number, itemIndex: number) => void | number = () => {},
    ) => {
      if (!columnData) {
        return
      }
      traverse(columnData as unknown as TraverseNode[], (item, _level, indexs) => {
        const columnIndex = indexs[0]
        const itemIndex = indexs[1]
        let itemDefaultIndex = defIndex[columnIndex]
        const itemDefaultValue = defValue[columnIndex]

        if (itemDefaultIndex === undefined && itemDefaultValue === undefined) {
          itemDefaultIndex = 0
        }

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

    const isColumnIndexInvalid = (columnIndex: number, itemIndex: number) => {
      const invalid = invalidIndex[columnIndex]
      return inArray(invalid as number | number[], itemIndex)
    }

    const hasValidIndex = (columnIndex: number) => {
      for (const key of data[columnIndex]?.keys() ?? []) {
        if (!isColumnIndexInvalid(columnIndex, key)) {
          return true
        }
      }
      warn(`hasValidIndex: has no valid items in column index ${columnIndex}`)
      return false
    }

    const findValidIndex = (columnIndex: number, count: number): number => {
      if (!hasValidIndex(columnIndex)) {
        return count
      }
      let tempCount = count
      while (isColumnIndexInvalid(columnIndex, tempCount)) {
        tempCount += scrollDirectRef.current
      }
      if (tempCount < 0 || tempCount > data[columnIndex].length - 1) {
        scrollDirectRef.current = -scrollDirectRef.current
        return findValidIndex(columnIndex, count)
      }
      return tempCount
    }

    const scrollInZoon = (scroller: ScrollerType, top: number) => {
      const maxTop = scroller.getScrollMax().top
      if (top < 0) {
        return 0
      } else if (top > maxTop) {
        return maxTop
      }
      return top
    }

    const scrollToIndex = (scroller: ScrollerType, itemIndex: number) => {
      scroller.scrollTo(0, itemIndex * style.indicatorHeight)
    }

    const scrollToValidIndex = (scroller: ScrollerType, columnIndex: number, itemIndex: number) => {
      const count = findValidIndex(columnIndex, itemIndex)
      scroller.scrollTo(0, scrollInZoon(scroller, count * style.indicatorHeight), true)
    }

    const initColumnIndex = () => {
      getColumnIndexByDefault(columnValuesRef.current, defaultIndex, defaultValue, (columnIndex, itemIndex) => {
        const scroller = scrollersRef.current[columnIndex]
        if (!scroller) {
          warn(`initialColumnIndex: scroller of column ${columnIndex} is undefined`)
          return
        }
        if (isColumnIndexInvalid(columnIndex, itemIndex)) {
          scrollToValidIndex(scroller, columnIndex, itemIndex)
        } else {
          scrollToIndex(scroller, itemIndex)
          setActiveIndex(columnIndex, itemIndex)
        }
      })
    }

    const initSingleColumnScroller = (container: HTMLElement, index: number) => {
      if (!rootRef.current) {
        return
      }
      const columns = rootRef.current.querySelectorAll<HTMLElement>('.column-list')
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
          scrollingComplete: () => onColumnScrollEnd(index),
        },
      )

      scroller.setPosition(rect.left + container.clientLeft, rect.top + container.clientTop)
      scroller.setDimensions(
        container.clientWidth,
        container.clientHeight,
        content.offsetWidth,
        content.offsetHeight + style.maskerHeight,
      )
      scroller.setSnapSize(0, style.indicatorHeight)

      scrollersRef.current[index] = scroller

      // reset scrolling position
      const columnValue = columnValuesRef.current[index] || []
      let oldActive = activedIndexsRef.current[index] || 0
      if (scroller && oldActive) {
        if (oldActive > columnValue.length - 1) {
          oldActive = columnValue.length - 1
        }
        scrollToIndex(scroller, oldActive)
        activedIndexsRef.current[index] = oldActive
      }
    }

    const initColumnsScroller = (startIndex = 0) => {
      const hookList = hooks()
      for (let i = startIndex, len = hookList.length; i < len; i++) {
        const container = hookList[i]
        if (container) {
          initSingleColumnScroller(container, i)
        }
      }
      if (!startIndex) {
        initColumnIndex()
        if (!isInitialedRef.current) {
          isInitialedRef.current = true
          setTimeout(() => onInitialed?.(), 0)
        }
      }
    }

    const onColumnScrollEnd = (index: number) => {
      const scroller = scrollersRef.current[index]
      if (!scroller) {
        return
      }
      const top = scroller.getValues().top
      const scrollTop = scrollInZoon(scroller, top)
      const activeItemIndex = Math.round(top / style.indicatorHeight)
      void scrollTop
      const isInvalid = isColumnIndexInvalid(index, activeItemIndex)

      if (isInvalid || activeItemIndex === activedIndexsRef.current[index]) {
        if (isInvalid) {
          scrollToValidIndex(scroller, index, activeItemIndex)
        }
        if (activeItemIndex === activedIndexsRef.current[index]) {
          scrollToIndex(scroller, activeItemIndex)
        }
        return
      }

      setActiveIndex(index, activeItemIndex)
      onChange?.(index, activeItemIndex, getColumnValue(index) as PickerColumnItem)
    }

    // 触摸事件（v2 触摸模型）
    const onColumnTouchStart = (event: React.TouchEvent | React.MouseEvent, index: number, isMouse = false) => {
      event.preventDefault()
      const scroller = scrollersRef.current[index]
      const touches = isMouse
        ? [{ pageX: (event as React.MouseEvent).pageX, pageY: (event as React.MouseEvent).pageY }]
        : Array.from((event as React.TouchEvent).touches)

      if (!scroller) {
        warn(`touchstart: scroller of column ${index} is undefined`)
        return
      }
      scrollPositionRef.current = isMouse
        ? (event as React.MouseEvent).pageY
        : (event as React.TouchEvent).touches[0].pageY
      scroller.doTouchStart(touches, event.timeStamp)
      if (isMouse) {
        isMouseDownRef.current = true
      }
    }

    const onColumnTouchMove = (event: React.TouchEvent | React.MouseEvent, index: number, isMouse = false) => {
      const scroller = scrollersRef.current[index]
      const touches = isMouse
        ? [{ pageX: (event as React.MouseEvent).pageX, pageY: (event as React.MouseEvent).pageY }]
        : Array.from((event as React.TouchEvent).touches)
      if (!scroller || (isMouse && !isMouseDownRef.current)) {
        return
      }
      const pageY = isMouse ? (event as React.MouseEvent).pageY : (event as React.TouchEvent).touches[0].pageY
      const diff = scrollPositionRef.current - pageY
      scrollDirectRef.current = diff ? diff / Math.abs(diff) : 1
      scroller.doTouchMove(touches, event.timeStamp)
      if (isMouse) {
        isMouseDownRef.current = true
      }
    }

    const onColumnTouchEnd = (event: React.TouchEvent | React.MouseEvent, index: number, isMouse = false) => {
      const scroller = scrollersRef.current[index]
      if (!scroller || (isMouse && !isMouseDownRef.current)) {
        return
      }
      scroller.doTouchEnd(event.timeStamp)
      if (isMouse) {
        isMouseDownRef.current = false
      }
    }

    const getColumnValue = (index = 0): PickerColumnItem | undefined => getColumnValues()[index]

    const getColumnValues = (): PickerColumnItem[] =>
      columnValuesRef.current.map(
        (item, index) => item[activedIndexsRef.current[index]],
      )

    useImperativeHandle(ref, () => ({
      refresh: (callback?: () => void, startIndex = 0) => {
        setTimeout(() => {
          initColumnsScroller(startIndex)
          callback?.()
        }, 0)
      },
      getColumnValue,
      getColumnValues,
      getColumnIndex: (index = 0) => activedIndexsRef.current[index],
      getColumnIndexs: () => activedIndexsRef.current,
      getColumnIndexByDefault,
      setColumnValues: (index: number, values: PickerColumnItem[], callback?: () => void) => {
        if (index === undefined || values === undefined) {
          return
        }
        if (!keepIndex) {
          setActiveIndex(index, 0)
        }
        columnValuesRef.current[index] = values
        setTimeout(() => {
          forceRender(n => n + 1)
          callback?.()
        }, 0)
      },
    }))

    const renderColumn = (column: PickerColumnItem[], i: number): ReactNode => (
      <div className="cu-picker-column-item" key={i}>
        <ul className="column-list" style={{ paddingTop: `${style.maskerHeight}px` }}>
          {column.map((item, j) => (
            <li
              key={j}
              className={`column-item${activedIndexsRef.current[i] === j ? ' active' : ''}${
                isColumnIndexInvalid(i, j) ? ' disabled' : ''
              }`}
              style={{ height: `${style.indicatorHeight}px`, lineHeight: `${style.indicatorHeight}px` }}
            >
              {item.text || item.label}
            </li>
          ))}
        </ul>
      </div>
    )

    return (
      <div
        ref={rootRef}
        className="cu-picker-column"
        style={{ height: `${style.indicatorHeight + 2 * style.maskerHeight}px` }}
      >
        <div className="cu-picker-column-container">
          <div className="cu-picker-column-masker top" style={{ height: `${style.maskerHeight}px` }}></div>
          <div className="cu-picker-column-masker bottom" style={{ height: `${style.maskerHeight}px` }}></div>
          <div className="cu-picker-column-list">
            {columnValuesRef.current.map((column, i) => renderColumn(column, i))}
            {cols
              ? Array.from({ length: Math.max(0, cols - columnValuesRef.current.length) }, (_, n) => (
                  <div className="cu-picker-column-item" key={n + columnValuesRef.current.length}>
                    <ul className="column-list" style={{ paddingTop: `${style.maskerHeight}px` }}></ul>
                  </div>
                ))
              : null}
          </div>
          <div className="cu-picker-column-hooks">
            {cols
              ? Array.from({ length: cols }, (_, n) => (
                  <div
                    key={n}
                    className="cu-picker-column-hook"
                    onTouchStart={event => onColumnTouchStart(event, n)}
                    onMouseDown={event => onColumnTouchStart(event, n, true)}
                    onTouchMove={event => onColumnTouchMove(event, n)}
                    onMouseMove={event => onColumnTouchMove(event, n, true)}
                    onTouchEnd={event => onColumnTouchEnd(event, n)}
                    onMouseUp={event => onColumnTouchEnd(event, n, true)}
                  ></div>
                ))
              : null}
          </div>
        </div>
      </div>
    )
  },
)
