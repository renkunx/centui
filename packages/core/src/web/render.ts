/**
 * 滚动位置渲染器（自 v2 _util/render.js 迁移）。
 * 按能力选择 translate3d / translate / margin+zoom 三级降级路径，
 * 供 scroll-view / swiper / picker-column 应用滚动偏移。
 *
 * 与 v2 差异：
 * - 探测改为惰性（首次调用）并拆出可独立测试的策略函数
 * - 移除 presto/trident 等历史引擎的厂商前缀探测，统一无前缀 transform
 *   （v3 目标浏览器均已支持；公共行为与 v2 一致）
 */
import { inBrowser } from '../env'

export type RenderFn = (
  content: HTMLElement,
  left: number,
  top: number,
  zoom?: number,
  useNativeDriver?: boolean,
) => void

/** 降级策略：仅偏移 margin（SSR 与无 transform 能力的环境） */
export const marginRender: RenderFn = (content, left, top, zoom) => {
  content.style.marginLeft = left ? `${-left}px` : ''
  content.style.marginTop = top ? `${-top}px` : ''
  content.style.zoom = (zoom || '') as never
}

/** translate 策略（无 perspective 能力） */
export const translateRender: RenderFn = (content, left, top, zoom = 1) => {
  content.style.setProperty('transform', `translate(${-left}px,${-top}px) scale(${zoom})`)
}

/** translate3d 策略（现代浏览器主路径，走 GPU 合成） */
export const translate3dRender: RenderFn = (content, left, top, zoom = 1, useNativeDriver = true) => {
  const transform = useNativeDriver
    ? `translate3d(${-left}px,${-top}px,0) scale(${zoom})`
    : `translate(${-left}px,${-top}px) scale(${zoom})`
  content.style.setProperty('transform', transform)
}

function detectTransformRender(doc: Document): RenderFn {
  const style = doc.createElement('div').style
  if ('transform' in style) {
    return 'perspective' in style ? translate3dRender : translateRender
  }
  return marginRender
}

let resolved: RenderFn | null = null

export const render: RenderFn = (content, left, top, zoom, useNativeDriver) => {
  if (!inBrowser) {
    return marginRender(content, left, top, zoom, useNativeDriver)
  }
  if (resolved === null) {
    resolved = detectTransformRender(content.ownerDocument ?? document)
  }
  return resolved(content, left, top, zoom, useNativeDriver)
}
