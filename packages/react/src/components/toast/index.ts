/**
 * Toast 命令式工厂（自 v2 components/toast/index.js 迁移，Vue.extend → createRoot 单例）。
 */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { CuToast, type ToastExposed, type ToastProps } from './Toast'

export type { ToastProps, ToastExposed }

interface ToastSingleton {
  container: HTMLElement
  root: Root
  exposed: ToastExposed | null
  props: ToastProps
}

let singleton: ToastSingleton | null = null

function renderSingleton(props: ToastProps) {
  const active = singleton
  if (!active) {
    return
  }
  active.props = props
  // flushSync 保证 ref 回调同步完成（工厂随后即可 show()）
  flushSync(() =>
    active.root.render(
      createElement(CuToast, {
        ...props,
        ref: (exposed: ToastExposed | null) => {
          active.exposed = exposed
        },
      }),
    ),
  )
}

function getSingleton(): ToastSingleton {
  if (!singleton) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    singleton = { container, root: createRoot(container), exposed: null, props: {} }
  } else if (!singleton.container.parentNode) {
    // v2 契约：容器脱管时重新挂载（如使用方清空 body）
    document.body.appendChild(singleton.container)
  }
  return singleton
}

/**
 * Toast factory
 */
const Toast = (props: ToastProps = {}): ToastExposed => {
  const store = getSingleton()
  renderSingleton({
    content: '',
    icon: '',
    iconSvg: false,
    duration: 3000,
    position: 'center',
    hasMask: false,
    square: false,
    ...props,
  })
  // 首帧 ref 回调同步于 render；并发下可能延后，兼容之
  if (!store.exposed) {
    throw new Error('[@centui/react] toast instance is not ready')
  }
  store.exposed.show()
  return store.exposed
}

/**
 * Hide toast
 */
Toast.hide = () => {
  if (singleton?.exposed?.visible) {
    singleton.exposed.hide()
  }
}

function preset(
  icon: string,
  iconSvg: boolean,
  defaultDuration: number,
  defaultHasMask: boolean,
):
  (content: string | number, duration?: number, hasMask?: boolean, parentNode?: HTMLElement, square?: boolean) => ToastExposed {
  return (content = '', duration = defaultDuration, hasMask = defaultHasMask, _parentNode, square = false) =>
    Toast({ icon, iconSvg, content, duration, hasMask, square })
}

/**
 * Show info toast
 */
Toast.info = preset('', false, 3000, false)
/**
 * Show succeed toast
 */
Toast.succeed = preset('success', false, 3000, false)
/**
 * Show failed toast
 */
Toast.failed = preset('fail', false, 3000, false)
/**
 * Show loading toast
 */
Toast.loading = preset('spinner', true, 0, true)

export { CuToast }
export default Toast
