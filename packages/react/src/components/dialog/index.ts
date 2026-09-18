/**
 * Dialog 命令式工厂（自 v2 components/dialog/index.js 迁移，Vue.extend → createRoot 受控重渲染）。
 */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { t } from '@mand-mobile/core'
import { MdDialog, type DialogBtn, type DialogExposed } from './Dialog'

export type { DialogBtn, DialogExposed }

const noop = () => {}

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
  options: GenerateOptions
}

// all active instances
const instances: DialogStore[] = []

function renderDialog(store: DialogStore) {
  const { options } = store
  flushSync(() =>
    store.root.render(
    createElement(MdDialog, {
      value: store.value,
      title: options.title ?? '',
      icon: options.icon ?? '',
      iconSvg: options.iconSvg ?? true,
      content: options.content ?? '',
      closable: options.closable ?? false,
      btns: options.btns ?? [],
      transition: options.transition ?? 'md-bounce',
      preventScroll: true,
      onChange: (val: boolean) => {
        if (!val) {
          closeStore(store)
        }
      },
      onShow: options.onShow,
      onHide: () => {
        const index = instances.indexOf(store)
        if (index >= 0) {
          instances.splice(index, 1)
        }
        options.onHide?.()
        // 卸载延后一拍：避免在自身 effect/flushSync 内同步 unmount 造成重入
        setTimeout(() => {
          store.root.unmount()
          store.container.remove()
        }, 0)
      },
    }),
  ))
}

function closeStore(store: DialogStore) {
  if (!store.value) {
    return
  }
  store.value = false
  // 异步渲染：与延后卸载一致，避免批量关闭时 flushSync 跨 root 调度互扰
  setTimeout(() => renderDialog(store), 0)
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
  transition = 'md-bounce',
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
    options: { title, icon, iconSvg, content, closable, transition, btns, onShow, onHide },
  }

  instances.push(store)
  renderDialog(store)

  return { close: () => closeStore(store) }
}

type DialogStatic = typeof MdDialog & {
  confirm: (options: ConfirmOptions) => DialogExposed
  alert: (options: AlertOptions) => DialogExposed
  succeed: (options: ConfirmOptions) => DialogExposed
  failed: (options: ConfirmOptions) => DialogExposed
  closeAll: () => void
}

const Dialog = MdDialog as DialogStatic

/**
 * Dynamically create a confirm dialog
 */
Dialog.confirm = ({
  title = '',
  icon = '',
  iconSvg = true,
  content = '',
  cancelText = t('md.dialog.cancel'),
  cancelWarning = false,
  confirmText = t('md.dialog.confirm'),
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
  confirmText = t('md.dialog.confirm'),
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

export { MdDialog }
export default Dialog
