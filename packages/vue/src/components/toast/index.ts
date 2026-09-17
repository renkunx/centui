/**
 * Toast 命令式工厂（自 v2 components/toast/index.js 迁移，Vue.extend → createVNode + render）。
 * 单例：同一时刻只有一个 toast 实例。
 */
import { createVNode, render, type VNode, type Ref } from 'vue'
import MdToast from './Toast.vue'

export interface ToastProps {
  content?: string | number
  icon?: string
  iconSvg?: boolean
  duration?: number
  position?: string
  hasMask?: boolean
  parentNode?: HTMLElement
  square?: boolean
}

interface ToastExposed {
  visible: Ref<boolean>
  show: () => void
  hide: () => void
}

/** 对外暴露 v2 形态：visible 为解包后的布尔值 */
interface ToastVm {
  visible: boolean
  show: () => void
  hide: () => void
}

interface ToastSingleton {
  container: HTMLElement
  vnode: VNode
  vm: ToastVm
}

let singleton: ToastSingleton | null = null

function getVm(props: ToastProps): ToastVm {
  const parentNode = props.parentNode ?? document.body
  if (!singleton || singleton.container.parentNode !== parentNode) {
    const container = document.createElement('div')
    parentNode.appendChild(container)
    singleton = { container, vnode: createVNode(MdToast, {}), vm: null as never }
  }

  singleton.vnode = createVNode(MdToast, {
    content: props.content ?? '',
    icon: props.icon ?? '',
    iconSvg: props.iconSvg ?? false,
    duration: props.duration ?? 3000,
    position: props.position ?? 'center',
    hasMask: props.hasMask ?? false,
    square: props.square ?? false,
  })
  render(singleton.vnode, singleton.container)
  const exposed = singleton.vnode.component?.exposed as unknown as ToastExposed
  singleton.vm = {
    get visible() {
      return exposed.visible.value
    },
    show: () => exposed.show(),
    hide: () => exposed.hide(),
  }
  return singleton.vm
}

/**
 * Toast factory
 *
 * @param props
 * @return Toast vm（含 show/hide/visible）
 */
const Toast = (props: ToastProps = {}): ToastVm => {
  const vm = getVm(props)
  vm.show()
  return vm
}

/**
 * Hide toast
 */
Toast.hide = () => {
  if (singleton && singleton.vm.visible) {
    singleton.vm.hide()
  }
}

/**
 * Show info toast
 */
Toast.info = (
  content: string | number = '',
  duration = 3000,
  hasMask = false,
  parentNode = document.body,
  square = false,
) => {
  return Toast({
    icon: '',
    content,
    duration,
    hasMask,
    parentNode,
    square,
  })
}

/**
 * Show succeed toast
 */
Toast.succeed = (
  content: string | number = '',
  duration = 3000,
  hasMask = false,
  parentNode = document.body,
  square = false,
) => {
  return Toast({
    icon: 'success',
    content,
    duration,
    hasMask,
    parentNode,
    square,
  })
}

/**
 * Show failed toast
 */
Toast.failed = (
  content: string | number = '',
  duration = 3000,
  hasMask = false,
  parentNode = document.body,
  square = false,
) => {
  return Toast({
    icon: 'fail',
    content,
    duration,
    hasMask,
    parentNode,
    square,
  })
}

/**
 * Show loading toast
 */
Toast.loading = (
  content: string | number = '',
  duration = 0,
  hasMask = true,
  parentNode = document.body,
  square = false,
) => {
  return Toast({
    icon: 'spinner',
    iconSvg: true,
    content,
    duration,
    hasMask,
    parentNode,
    square,
  })
}

Toast.component = MdToast

export { MdToast }
export default Toast
