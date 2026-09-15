/**
 * 浏览器专属的语言工具（自 v2 _util/lang.js 拆出）
 */
import { inBrowser } from '../env'

/**
 * 动态加载外部脚本
 */
export function requireRemoteScript(src: string, callback?: () => void): void {
  const doc = document
  const head = doc.head || doc.getElementsByTagName('head')[0]

  let node: HTMLScriptElement | null = doc.createElement('script')
  const supportOnload = 'onload' in node
  const onload = () => {
    node = null
    if (typeof callback === 'function') {
      callback()
    }
  }

  if (supportOnload) {
    node.onload = onload
  } else {
    /* istanbul ignore next: IE 时代的 onreadystatechange 分支，现代环境不可达 */
    const legacyNode = node as unknown as { onreadystatechange: (() => void) | null; readyState?: string }
    legacyNode.onreadystatechange = () => {
      if (/loaded|complete/.test(legacyNode.readyState ?? '')) {
        onload()
      }
    }
  }

  node.async = true
  node.crossOrigin = true as never
  node.charset = 'utf-8'
  node.src = src
  head.appendChild(node)
}

export function getDpr(): number {
  const getParam = (name: string, str: string | null): string | null => {
    const reg = new RegExp(`(^|,)${name}=([^,]*)(,|$)`, 'i')
    const r = str?.match(reg)
    if (r != null) {
      return r[2]
    }
    return null
  }

  const viewPort = inBrowser ? document.querySelector('meta[name=viewport]') : null

  if (!viewPort) {
    return 1
  }

  const viewPortContent = viewPort.getAttribute('content')
  const initialScale = +(getParam('initial-scale', viewPortContent) || 1)
  const maximumScale = +(getParam('maximum-scale', viewPortContent) || 1)
  const minimumScale = +(getParam('minimum-scale', viewPortContent) || 1)

  return 1 / Math.min(initialScale, maximumScale, minimumScale)
}

/**
 * transform a Function to Blob Url
 */
export function functionToUrl(fn: () => unknown): string {
  const blob = new Blob([`(${fn.toString()})(null)`], { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}
