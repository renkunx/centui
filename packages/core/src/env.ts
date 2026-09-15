/**
 * 环境探测（自 v2 _util/env.js 迁移）。
 * v2 依赖 Vue.prototype.$isServer，v3 以 typeof window 判定，任何框架可用。
 */

export const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'

/** 浏览器环境（SSR/RN/小程序侧为 false） */
export const inBrowser = typeof window !== 'undefined'

export const UA: string = inBrowser ? window.navigator.userAgent.toLowerCase() : ''

export const isAndroid: boolean = !!UA && UA.indexOf('android') > 0

export const isIOS: boolean = !!UA && /iphone|ipad|ipod|ios/.test(UA)
