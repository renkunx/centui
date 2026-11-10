/**
 * ActionSheet 命令式工厂（自 v2 components/action-sheet/index.js 迁移）。
 *
 * 卸载保证（S1 修复）：卸载不依赖过渡完成事件。close/onChange(false) 走显式关闭路径
 * 并在兜底定时器内 destroyStore；onHide（过渡完成）到达时提前 destroy，二者幂等。
 */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { CuActionSheet, type ActionSheetOption } from './ActionSheet'

export type { ActionSheetOption, ActionSheetProps } from './ActionSheet'

const noop = () => {}

/** close 后等待过渡/兜底的卸载时限（应大于弹层动画最长时长） */
const UNMOUNT_FALLBACK_MS = 450

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
  /** 是否展示过：未展示过的实例 close 直接清理；展示过的等待 onHide/兜底卸载 */
  everOpened: boolean
  destroyed: boolean
  unmountTimer: ReturnType<typeof setTimeout> | null
  props: ActionSheetCreateProps
}

// all active instances
const instances: ActionSheetStore[] = []

function removeFromInstances(store: ActionSheetStore) {
  const index = instances.indexOf(store)
  if (index >= 0) {
    instances.splice(index, 1)
  }
}

function destroyStore(store: ActionSheetStore) {
  if (store.destroyed) {
    return
  }
  store.destroyed = true
  if (store.unmountTimer) {
    clearTimeout(store.unmountTimer)
    store.unmountTimer = null
  }
  removeFromInstances(store)
  store.root.unmount()
  store.container.remove()
}

function scheduleUnmount(store: ActionSheetStore, delay = UNMOUNT_FALLBACK_MS) {
  if (store.destroyed) {
    return
  }
  // 总是以更近的时限替换（onHide 到达时立即卸载，兜底定时器作废）
  if (store.unmountTimer) {
    clearTimeout(store.unmountTimer)
  }
  const destroy = () => destroyStore(store)
  if (delay === 0) {
    // 微任务：晚于当前 flushSync/事件栈，且在 act 等待窗口内必然到达（测试确定性）
    queueMicrotask(destroy)
    return
  }
  store.unmountTimer = setTimeout(destroy, delay)
}

function renderSheet(store: ActionSheetStore) {
  const { props } = store
  flushSync(() =>
    store.root.render(
    createElement(CuActionSheet, {
      value: store.value,
      title: props.title ?? '',
      options: props.options ?? [],
      defaultIndex: props.defaultIndex ?? -1,
      invalidIndex: props.invalidIndex ?? -1,
      cancelText: props.cancelText,
      maxHeight: props.maxHeight,
      onShow: props.onShow,
      onSelected: props.onSelected,
      onCancel: props.onCancel,
      onHide: () => {
        // 过渡完成（S1 修复后生产环境会触发）：下一拍卸载（避免在 flushSync 内同步 unmount）
        props.onHide?.()
        scheduleUnmount(store, 0)
      },
      onChange: (val: boolean) => {
        store.value = val
        renderSheet(store)
      },
    }),
  ))
}

type ActionSheetStatic = typeof CuActionSheet & {
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
    everOpened: value,
    destroyed: false,
    unmountTimer: null,
    props: { title, options, defaultIndex, invalidIndex, cancelText, maxHeight, onShow, onHide, onSelected, onCancel },
  }

  const instance: ActionSheetInstance = {
    get value() {
      return store.value
    },
    close: () => {
      store.value = false
      renderSheet(store)
      if (!store.everOpened) {
        // 未曾展示（value=false 创建）：直接清理容器，杜绝泄漏
        setTimeout(() => destroyStore(store), 0)
        return
      }
      // 关闭路径缺失过渡回调时，兜底清理容器
      scheduleUnmount(store)
    },
  }

  instances.push(store)

  if (value) {
    store.value = true
  }
  renderSheet(store)

  return instance
}

const ActionSheet = CuActionSheet as ActionSheetStatic
ActionSheet.create = create

export { CuActionSheet }
export default ActionSheet
