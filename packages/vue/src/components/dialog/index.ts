/**
 * Dialog 命令式工厂（自 v2 components/dialog/index.js 迁移，Vue.extend → createVNode + render）。
 * 导出的 Dialog 既是可模板使用的组件，也携带 confirm/alert/succeed/failed/closeAll 静态方法（v2 契约）。
 */
import { createVNode, render } from 'vue'
import { t } from '@mand-mobile/core'
import MdDialogComponent, { type DialogBtn } from './Dialog.vue'

export type { DialogBtn }

const noop = () => {}

interface DialogInstance {
  close: () => void
}

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

type DialogStatic = typeof MdDialogComponent & {
  confirm: (options: ConfirmOptions) => DialogInstance
  alert: (options: AlertOptions) => DialogInstance
  succeed: (options: ConfirmOptions) => DialogInstance
  failed: (options: ConfirmOptions) => DialogInstance
  closeAll: () => void
}

export type { ConfirmOptions as DialogConfirmOptions, AlertOptions as DialogAlertOptions }

// all active instances
const instances: DialogInstance[] = []

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
}: GenerateOptions): DialogInstance {
  const container = document.createElement('div')
  document.body.appendChild(container)

  let value = true

  const mount = () => {
    const vnode = createVNode(MdDialogComponent, {
      modelValue: value,
      title,
      icon,
      iconSvg,
      content,
      closable,
      btns,
      transition,
      preventScroll: true,
      'onUpdate:modelValue': (val: boolean) => {
        if (!val) {
          instance.close()
        }
      },
      onShow,
      onHide: () => {
        const index = instances.indexOf(instance)
        if (index >= 0) {
          instances.splice(index, 1)
        }
        render(null, container)
        container.remove()
        onHide()
      },
    })
    render(vnode, container)
  }

  const instance: DialogInstance = {
    close: () => {
      if (!value) {
        return
      }
      value = false
      mount()
    },
  }

  instances.push(instance)
  mount()

  return instance
}

const Dialog = MdDialogComponent as DialogStatic

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
  instances.forEach((instance) => {
    instance.close()
  })
}

export { MdDialogComponent as MdDialog }
export default Dialog
