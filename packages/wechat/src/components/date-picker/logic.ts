/**
 * date-picker 列数据生成：直接复用 @centui/core/picker/date（三端同一实现，
 * 禁止在本文件内再维护副本）。本文件只保留小程序侧的属性归一 toDate。
 *
 * 说明：min/max/defaultDate 在 wxml 侧无法传 Date 对象，属性统一经 toDate 归一为
 * Date；textRender 为函数属性，小程序组件层按平台限制不传（见组件头注释）。
 */
import { buildDateColumns, formatDate, getDateColumnGenerators } from '@centui/core'
import type {
  DateColumnGenerator,
  DateColumnItem,
  DateColumnType,
  DateColumnTypeFormat,
  DatePickerColumnOptions,
  DatePickerColumns,
  PrevColumnRef,
} from '@centui/core'

export { buildDateColumns, formatDate, getDateColumnGenerators }
export type {
  DateColumnGenerator,
  DateColumnItem,
  DateColumnType,
  DateColumnTypeFormat,
  DatePickerColumnOptions,
  DatePickerColumns,
  PrevColumnRef,
}

/** min/max/defaultDate 属性归一（小程序侧接受 Date | 时间戳数字 | 可解析字符串） */
export function toDate(v: unknown): Date | undefined {
  if (v == null || v === '') return undefined
  if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v
  if (typeof v === 'number' && isFinite(v)) return new Date(v)
  if (typeof v === 'string') {
    const d = new Date(v.replace(/-/g, '/'))
    return isNaN(d.getTime()) ? undefined : d
  }
  return undefined
}
