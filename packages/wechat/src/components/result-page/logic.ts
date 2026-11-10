/**
 * result-page 纯逻辑（对照 Vue 版 ResultPage.vue 的 actualImgUrl/actualText/
 * actualSubText computed 与 ResultPageButton 结构）。
 * t() 取自 @centui/core 主入口 locale 模块（相对路径引入，理由同
 * amount/logic.ts 头注释：workspace 未链接 @centui/core 包说明符）。
 */
import {t} from '@centui/core'

export interface ResultPageButton {
  text?: string
  type?: string
  plain?: boolean
  round?: boolean
  inactive?: boolean
  loading?: boolean
  icon?: string
  iconSvg?: boolean
  /** 小程序侧仅在实例赋值传入时可调用（setData/wxml 无法携带函数），否则走 buttonClick 事件 */
  handler?: () => void
}

/** Vue 实际前缀：'//manhattan.didistatic.com/...'，小程序 image 需完整协议，补 https: */
const IMG_PREFIX = 'https://manhattan.didistatic.com/static/manhattan/mand-mobile/result-page/2.1/'

/** Vue actualImgUrl：imgUrl || `${pre}${type}.png`（协议相对 → https 完整协议） */
export function actualImgUrl(imgUrl: string, type: string): string {
  return imgUrl || `${IMG_PREFIX}${type}.png`
}

/** Vue actualText：text || {network, empty}[type] || ''（默认文案走 core t()） */
export function actualText(text: string, type: string): string {
  if (text) {
    return text
  }
  if (type === 'network') {
    return String(t('md.result_page.networkError'))
  }
  if (type === 'empty') {
    return String(t('md.result_page.noInformation'))
  }
  return ''
}

/** Vue actualSubText：subtext || {lost}[type] || '' */
export function actualSubText(subtext: string, type: string): string {
  if (subtext) {
    return subtext
  }
  if (type === 'lost') {
    return String(t('md.result_page.lostWay'))
  }
  return ''
}

/** Vue :plain="button.plain === undefined || button.plain"（缺省恒 plain） */
export function buttonPlain(plain: boolean | undefined): boolean {
  return plain === undefined || plain
}

/** 图片内联样式：result-page.styl 的 img 标签选择器（width:100%; margin-bottom:40px）
 *  在小程序 image 组件上不生效，以内联样式承担（rpx 与构建期 px→rpx 恒等换算一致） */
export const IMAGE_INLINE_STYLE = 'width:100%;margin-bottom:40rpx;'
