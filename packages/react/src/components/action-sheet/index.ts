/**
 * ActionSheet 命令式工厂（自 v2 components/action-sheet/index.js 迁移）。
 */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { MdActionSheet, type ActionSheetOption } from './ActionSheet'

export type { ActionSheetOption, ActionSheetProps } from './ActionSheet'

const noop = () => {}

export interface ActionSheetCreateProps {
  value?: boolean
  title?: string
  options?: ActionSheetOption[]
  defaultIndex?: number
  invalidIndex?: number | number[]
  cancelText?: string
  maxHeight?: number
  onShow?: () => void
  onHide?: () => void
  onSelected?: (option: ActionSheetOption) => void
  onCancel?: () => void
}

interface ActionSheetInstance {
  value: boolean
  close: () => void
}

interface ActionSheetStore {
  container: HTMLElement
  root: Root
  value: boolean
  props: ActionSheetCreateProps
}

// all active instances
const instances: ActionSheetStore[] = []

function renderSheet(store: ActionSheetStore) {
  const { props } = store
  flushSync(() =>
    store.root.render(
    createElement(MdActionSheet, {
      value: store.value,
      title: props.title ?? '',
      options: props.options ?? [],
      defaultIndex: props.defaultIndex ?? -1,
      invalidIndex: props.invalidIndex ?? -1,
      cancelText: props.cancelText,
      maxHeight: props.maxHeight ?? 400,
      onShow: props.onShow,
      onSelected: props.onSelected,
      onCancel: props.onCancel,
      onHide: () => {
        const index = instances.indexOf(store)
        if (index >= 0) {
          instances.splice(index, 1)
        }
        store.root.unmount()
        store.container.remove()
        props.onHide?.()
      },
      onChange: (val: boolean) => {
        store.value = val
        renderSheet(store)
      },
    }),
  ))
}

type ActionSheetStatic = typeof MdActionSheet & {
  create: (props: ActionSheetCreateProps) => ActionSheetInstance
}

function create({
  value = true,
  title = '',
  options = [],
  defaultIndex = -1,
  invalidIndex = -1,
  cancelText = '取消',
  maxHeight = 400,
  onShow = noop,
  onHide = noop,
  onSelected = noop,
  onCancel = noop,
}: ActionSheetCreateProps): ActionSheetInstance {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const store: ActionSheetStore = {
    container,
    root: createRoot(container),
    value: false,
    props: { title, options, defaultIndex, invalidIndex, cancelText, maxHeight, onShow, onHide, onSelected, onCancel },
  }

  const instance: ActionSheetInstance = {
    get value() {
      return store.value
    },
    close: () => {
      store.value = false
      renderSheet(store)
    },
  }

  instances.push(store)

  if (value) {
    store.value = true
  }
  renderSheet(store)

  return instance
}

const ActionSheet = MdActionSheet as ActionSheetStatic
ActionSheet.create = create

export { MdActionSheet }
export default ActionSheet
