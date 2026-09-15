/**
 * 开发告警（自 v2 _util/debug.js 迁移）
 */
import { isProd } from './env'

export const warn = (msg: string, fn: 'error' | 'warn' = 'error'): void => {
  if (!isProd) {
    console[fn](`[Mand-Mobile]: ${msg}`)
  }
}
