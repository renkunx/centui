/**
 * ActionSheet 命令式工厂（自 v2 components/action-sheet/index.js 迁移）。
 */
import { createVNode, render } from 'vue'
import MdActionSheetComponent, { type ActionSheetOption } from './ActionSheet.vue'

export type { ActionSheetOption }

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

type ActionSheetStatic = typeof MdActionSheetComponent & {
  create: (props: ActionSheetCreateProps) => ActionSheetInstance
}

// all active instances
const instances: ActionSheetInstance[] = []

/**
 * Dynamically create an ActionSheet
 */
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

  const instance = { value: false, close: () => {} } as ActionSheetInstance

  const mount = () => {
    const vnode = createVNode(MdActionSheetComponent, {
      modelValue: instance.value,
      title,
      options,
      defaultIndex,
      invalidIndex,
      cancelText,
      maxHeight,
      'onUpdate:modelValue': (val: boolean) => {
        instance.value = val
        if (val) {
          mount()
        }
      },
      onShow,
      onHide: () => {
        const parent = container.parentNode
        if (parent) {
          parent.removeChild(container)
        }
        const index = instances.indexOf(instance)
        if (index >= 0) {
          instances.splice(index, 1)
        }
        render(null, container)
        onHide()
      },
      onSelected,
      onCancel,
    })
    render(vnode, container)
  }

  instance.close = () => {
    instance.value = false
    mount()
  }

  instances.push(instance)

  if (value) {
    instance.value = true
    mount()
  }

  return instance
}

const ActionSheet = MdActionSheetComponent as ActionSheetStatic
ActionSheet.create = create

export { MdActionSheetComponent as MdActionSheet }
export default ActionSheet
