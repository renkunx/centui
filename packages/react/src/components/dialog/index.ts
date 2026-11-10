/**
 * Dialog 命令式工厂（自 v2 components/dialog/index.js 迁移，Vue.extend → createRoot 受控重渲染）。
 *
 * 卸载保证（S1 修复）：卸载不依赖过渡完成事件。closeStore 走显式关闭路径并在
 * 兜底定时器内 destroyStore；onHide（过渡完成）到达时提前 destroy，二者幂等。
 */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { t } from '@centui/core'
import { CuDialog, type DialogBtn, type DialogExposed } from './Dialog'

export type { DialogBtn, DialogExposed }

const noop = () => {}

/** close 后等待过渡/兜底的卸载时限（应大于弹层动画最长时长） */
const UNMOUNT_FALLBACK_MS = 450

interface GenerateOptions {
  title?: string
  icon?: string
  iconSvg?: boolean
  content?: string
  closable?: boolean
  transition?: string
  btns?: DialogBtn[]
  onShow?: () => void
  onHide?: () => void
}

interface ConfirmOptions extends Omit<GenerateOptions, 'btns'> {
  cancelText?: string
  cancelWarning?: boolean
  confirmText?: string
  confirmWarning?: boolean
  onConfirm?: () => boolean | void
  onCancel?: () => boolean | void
}

interface AlertOptions extends Omit<GenerateOptions, 'btns'> {
  confirmText?: string
  warning?: boolean
  onConfirm?: () => boolean | void
}

interface DialogStore {
  container: HTMLElement
  root: Root
  value: boolean
  /** 是否展示过：未展示过的实例 close 直接清理；展示过的等待 onHide/兜底卸载 */
  everOpened: boolean
  destroyed: boolean
  unmountTimer: ReturnType<typeof setTimeout> | null
  options: GenerateOptions
}

// all active instances
const instances: DialogStore[] = []

function removeFromInstances(store: DialogStore) {
  const index = instances.indexOf(store)
  if (index >= 0) {
    instances.splice(index, 1)
  }
}

function destroyStore(store: DialogStore) {
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

function scheduleUnmount(store: DialogStore, delay = UNMOUNT_FALLBACK_MS) {
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

function renderDialog(store: DialogStore) {
  const { options } = store
  flushSync(() =>
    store.root.render(
    createElement(CuDialog, {
      value: store.value,
      title: options.title ?? '',
      icon: options.icon ?? '',
      iconSvg: options.iconSvg ?? true,
      content: options.content ?? '',
      closable: options.closable ?? false,
      btns: options.btns ?? [],
      transition: options.transition ?? 'cu-bounce',
      preventScroll: true,
      onChange: (val: boolean) => {
        if (!val) {
          closeStore(store)
        }
      },
      onShow: options.onShow,
      onHide: () => {
        // 过渡完成（S1 修复后生产环境会触发）：下一拍卸载（避免在 flushSync 内同步 unmount），
        // 兜底定时器随之被更近时限替换
        options.onHide?.()
        scheduleUnmount(store, 0)
      },
    }),
  ))
}

function closeStore(store: DialogStore) {
  if (store.destroyed) {
    return
  }
  if (!store.value) {
    // 仅「从未打开」的实例立即清理（避免在渲染/flushSync 内同步 unmount，延后一拍）；
    // 已正常展示过的实例等待过渡完成（onHide → 立即卸载）或兜底定时器
    if (!store.everOpened) {
      setTimeout(() => destroyStore(store), 0)
    }
    return
  }
  store.value = false
  // 异步渲染：与延后卸载一致，避免批量关闭时 flushSync 跨 root 调度互扰
  setTimeout(() => renderDialog(store), 0)
  // 兜底：即便过渡完成事件缺失也保证 root.unmount + 容器移除
  scheduleUnmount(store)
}

/**
 * Dialog factory
 */
function generate({
  title = '',
  icon = '',
  iconSvg = true,
  content = '',
  closable = false,
  transition = 'cu-bounce',
  btns = [],
  onShow = noop,
  onHide = noop,
}: GenerateOptions): DialogExposed {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const store: DialogStore = {
    container,
    root: createRoot(container),
    value: true,
    everOpened: true,
    destroyed: false,
    unmountTimer: null,
    options: { title, icon, iconSvg, content, closable, transition, btns, onShow, onHide },
  }

  instances.push(store)
  renderDialog(store)

  return { close: () => closeStore(store) }
}

type DialogStatic = typeof CuDialog & {
  confirm: (options: ConfirmOptions) => DialogExposed
  alert: (options: AlertOptions) => DialogExposed
  succeed: (options: ConfirmOptions) => DialogExposed
  failed: (options: ConfirmOptions) => DialogExposed
  closeAll: () => void
}

const Dialog = CuDialog as DialogStatic

/**
 * Dynamically create a confirm dialog
 */
Dialog.confirm = ({
  title = '',
  icon = '',
  iconSvg = true,
  content = '',
  cancelText = String(t('md.dialog.cancel')),
  cancelWarning = false,
  confirmText = String(t('md.dialog.confirm')),
  confirmWarning = false,
  closable = false,
  transition,
  onConfirm = noop,
  onCancel = noop,
  onShow = noop,
  onHide = noop,
}: ConfirmOptions) => {
  const vm = generate({
    title,
    icon,
    iconSvg,
    content,
    closable,
    transition,
    onShow,
    onHide,
    btns: [
      {
        text: cancelText,
        warning: cancelWarning,
        handler: () => {
          if (onCancel() !== false) {
            vm.close()
          }
        },
      },
      {
        text: confirmText,
        warning: confirmWarning,
        handler: () => {
          if (onConfirm() !== false) {
            vm.close()
          }
        },
      },
    ],
  })
  return vm
}

/**
 * Dynamically create an alert dialog
 */
Dialog.alert = ({
  title = '',
  icon = '',
  iconSvg = true,
  content = '',
  confirmText = String(t('md.dialog.confirm')),
  closable = false,
  warning = false,
  transition,
  onConfirm = noop,
  onShow = noop,
  onHide = noop,
}: AlertOptions) => {
  const vm = generate({
    title,
    icon,
    iconSvg,
    content,
    closable,
    transition,
    onShow,
    onHide,
    btns: [
      {
        text: confirmText,
        warning,
        handler: () => {
          if (onConfirm() !== false) {
            vm.close()
          }
        },
      },
    ],
  })
  return vm
}

/**
 * Dynamically create a succeed dialog
 */
Dialog.succeed = (options: ConfirmOptions) => {
  options.icon = 'success-color'
  return Dialog.confirm(options)
}

/**
 * Dynamically create a failed dialog
 */
Dialog.failed = (options: ConfirmOptions) => {
  options.icon = 'warn-color'
  return Dialog.confirm(options)
}

/**
 * Close all actived static dialogs
 */
Dialog.closeAll = () => {
  instances.forEach(store => closeStore(store))
}

export { CuDialog }
export default Dialog
