/**
 * ActionSheet 命令式工厂（自 v2 components/action-sheet/index.js 迁移）。
 */
import { createVNode, render } from 'vue'
import CuActionSheetComponent, { type ActionSheetOption } from './ActionSheet.vue'

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

type ActionSheetStatic = typeof CuActionSheetComponent & {
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

  /** 是否执行过首次 mount（决定 close 走弹层关闭还是直接清理） */
  let mounted = false
  /** 容器是否已清理（onHide/close 兜底），保证清理幂等 */
  let destroyed = false

  const cleanup = () => {
    if (destroyed) {
      return
    }
    destroyed = true
    render(null, container)
    const parent = container.parentNode
    if (parent) {
      parent.removeChild(container)
    }
    const index = instances.indexOf(instance)
    if (index >= 0) {
      instances.splice(index, 1)
    }
  }

  const mount = () => {
    const vnode = createVNode(CuActionSheetComponent, {
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
        cleanup()
        onHide()
      },
      onSelected,
      onCancel,
    })
    render(vnode, container)
    mounted = true
  }

  instance.close = () => {
    if (destroyed) {
      return
    }
    if (!mounted) {
      // 从未显示过（value:false 创建后直接 close）：不会触发 hide 回调，
      // 必须直接清理容器与登记，否则空容器与实例会永久滞留
      cleanup()
      return
    }
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

const ActionSheet = CuActionSheetComponent as ActionSheetStatic
ActionSheet.create = create

export { CuActionSheetComponent as CuActionSheet }
export default ActionSheet
