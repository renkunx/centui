import { forwardRef, useEffect, useRef, useState, useImperativeHandle, type ReactNode } from 'react'
import { MdPopup } from '../popup/Popup'
import { MdPopupTitleBar } from '../popup/PopupTitleBar'
import { MdIcon } from '../icon/Icon'
import { MdTabs } from '../tabs/Tabs'
import { MdTabPane } from '../tabs/TabPane'
import { MdScrollView, type ScrollViewExposed } from '../scroll-view/ScrollView'
import { MdRadioList } from '../radio-list/RadioList'
import type { RadioListOption } from '../radio-list/RadioList'

export interface TabPickerOption {
  value?: string | number
  label?: string
  children?: TabPickerNode
}

export interface TabPickerNode {
  name?: string
  label?: string
  value?: string | number
  children?: TabPickerNode
  options?: TabPickerOption[]
}

export interface TabPickerProps {
  value?: boolean
  data?: TabPickerNode
  defaultValue?: Array<string | number>
  placeholder?: string
  title?: string
  describe?: string
  maskClosable?: boolean
  largeRadius?: boolean
  children?: (slotProps: { option: { value?: string | number; label?: string; text?: string } }) => ReactNode
  onSelect?: (payload: { index: number; value: string | number | boolean | undefined; option: unknown }) => void
  onChange?: (payload: { values: Array<string | number>; options: Array<unknown> }) => void
  /** 显隐状态变化（对齐 v2 input 事件） */
  onInput?: (value: boolean) => void
  onShow?: () => void
  onHide?: () => void
}

export interface TabPickerExposed {
  getSelectedValues: () => Array<string | number>
  getSelectedOptions: () => Array<unknown>
}

interface Pane {
  name?: string
  label?: string
  value: string | number | undefined
  selected: unknown
  options: Array<{ value?: string | number; label?: string }>
}

const CHOOSE_TEXT = '请选择'

export const MdTabPicker = forwardRef<TabPickerExposed, TabPickerProps>(function MdTabPicker(
  {
    value = false,
    data = {},
    defaultValue = [],
    placeholder = CHOOSE_TEXT,
    title = '',
    describe = '',
    maskClosable = true,
    largeRadius = false,
    children,
    onSelect,
    onChange,
    onInput,
    onShow,
    onHide,
  },
  ref,
) {
  const tabsRef = useRef<{ reflowTabBar: () => void } | null>(null)
  const scrollViewRef = useRef<ScrollViewExposed | null>(null)

  const [selected, setSelected] = useState<Array<string | number>>(defaultValue.slice())
  const oldSelectedRef = useRef<Array<string | number>>([])
  const [currentTab, setCurrentTab] = useState<string | undefined>(data.name)
  const oldCurrentTabRef = useRef<string | undefined>('')
  const [tabsTmpKey, setTabsTmpKey] = useState(() => Date.now())

  const hasSlot = !!children

  // v2 computed panes：由嵌套 data 与 selected 派生，推进 cursor 走 children
  const buildPanes = (sel: Array<string | number>): Pane[] => {
    const result: Pane[] = []
    let target: TabPickerNode | undefined = data
    let cursor = 0
    while (target && target.name) {
      const pane: Pane = {
        name: target.name,
        label: target.label || placeholder,
        value: sel[cursor],
        selected: null,
        options: (target.options ?? []) as Array<{ value?: string | number; label?: string }>,
      }
      let find = false
      const options = (target.options ?? []) as Array<{ value?: string | number; label?: string; children?: TabPickerNode }>
      for (let i = 0, len = options.length; i < len; i++) {
        if (options[i].value === sel[cursor]) {
          pane.label = options[i].label
          pane.selected = options[i]
          target = options[i].children
          find = true
          cursor++
          break
        }
      }
      if (!find) {
        target = undefined
      }
      result.push(pane)
    }
    return result
  }

  const panes = buildPanes(selected)
  // v2 契约：选中推进时同步选中对应 tab（取最后一个 pane）
  const panesRef = useRef(panes)
  panesRef.current = panes

  // v2 created
  useEffect(() => {
    if (data) {
      setCurrentTab(data.name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onPopupShow() {
    tabsRef.current?.reflowTabBar()
    onShow?.()
    setTimeout(() => {
      oldSelectedRef.current = selected.slice()
      oldCurrentTabRef.current = currentTab
    }, 100)
  }

  function onCancel() {
    onInput?.(false)
    setTimeout(() => {
      setSelected(oldSelectedRef.current.slice())
      setCurrentTab(oldCurrentTabRef.current)
      setTabsTmpKey(Date.now())
    }, 100)
  }

  const propsOnChangeRef = useRef(onChange)
  propsOnChangeRef.current = onChange
  const propsSelectRef = useRef(onSelect)
  propsSelectRef.current = onSelect
  const propsInputRef = useRef(onInput)
  propsInputRef.current = onInput

  function onSelectPaneItem(value: string | number | boolean | undefined, index: number) {
    setSelected((prev) => {
      const next = prev.slice(0, index)
      next[index] = value as string | number
      return next
    })
    // v2 nextTick 语义
    setTimeout(() => {
      const nextPanes = buildPanes(
        (() => {
          const next = selected.slice(0, index)
          next[index] = value as string | number
          return next
        })(),
      )
      propsSelectRef.current?.({
        index,
        value,
        option: nextPanes[index],
      })

      const nextPane = nextPanes[index + 1]
      if (nextPane) {
        setCurrentTab(nextPane.name)
        scrollViewRef.current?.scrollTo(0, 0)
      } else if (value !== '') {
        setTimeout(() => {
          const values = nextPanes.filter((p) => p.value).map((p) => p.value as string | number)
          const options = nextPanes.filter((p) => p.value).map((p) => p.selected)
          propsOnChangeRef.current?.({ values, options })
          propsInputRef.current?.(false)
        }, 300)
      }
    }, 0)
  }

  useImperativeHandle(ref, () => ({
    getSelectedValues: () => selected.slice(),
    getSelectedOptions: () => panes.filter((p) => p.value).map((p) => p.selected),
  }))

  return (
    <div className="md-tab-picker">
      <MdPopup
        value={value}
        position="bottom"
        maskClosable={maskClosable}
        onShow={onPopupShow}
        onHide={onHide}
        onMaskClick={onCancel}
      >
        <MdPopupTitleBar
          title={title}
          describe={describe}
          largeRadius={largeRadius}
          onlyClose
          onCancel={onCancel}
          cancelSlot={<MdIcon name="close" size="lg" />}
        />
        <div className="md-tab-picker-content">
          <MdTabs key={tabsTmpKey} value={currentTab} inkLength={100} ref={tabsRef as never}>
            <MdScrollView ref={scrollViewRef} scrollingX={false} autoReflow>
              {panes.map((pane, index) => (
                <MdTabPane key={pane.name} name={pane.name} label={pane.label}>
                  <MdRadioList
                    value={pane.value}
                    options={pane.options as never}
                    isSlotScope={hasSlot}
                    icon=""
                    iconInverse=""
                    iconPosition="right"
                    onChangeValue={(v) => onSelectPaneItem(v, index)}
                    children={
                      children
                        ? (slotProps: { option: RadioListOption; index: number; selected: boolean }) =>
                            children({ option: slotProps.option as { value?: string | number; label?: string; text?: string } })
                        : undefined
                    }
                  />
                </MdTabPane>
              ))}
            </MdScrollView>
          </MdTabs>
        </div>
      </MdPopup>
    </div>
  )
})
