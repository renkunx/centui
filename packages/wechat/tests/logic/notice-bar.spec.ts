import {describe, it, expect} from 'vitest'
import {rightIcon, isOverflow, buildBarClass} from '../../src/components/notice-bar/logic'

describe('notice-bar/logic', () => {
  it('rightIcon：link → arrow，其余（closable/空）→ close', () => {
    expect(rightIcon('link')).toBe('arrow')
    expect(rightIcon('closable')).toBe('close')
    expect(rightIcon('')).toBe('close')
  })

  it('溢出判定：contentWidth - paddingLeft > ceil(wrapWidth)（对齐 Vue checkOverflow）', () => {
    // 恰好等于 → 不算溢出（ceil 边界）
    expect(isOverflow(100, 0, 100)).toBe(false)
    expect(isOverflow(100.5, 0, 100)).toBe(true) // ceil(100) = 100，100.5 > 100
    expect(isOverflow(120, 20, 100)).toBe(false) // 120-20 = 100，不大于
    expect(isOverflow(121, 20, 100)).toBe(true)
    expect(isOverflow(50, 10, 100)).toBe(false)
  })

  it('根类名：round 修饰符 + 类型（default/activity/warning）', () => {
    expect(buildBarClass(false, 'default')).toBe('cu-notice-bar default')
    expect(buildBarClass(true, 'default')).toBe('cu-notice-bar cu-notice-bar-round default')
    expect(buildBarClass(true, 'warning')).toBe('cu-notice-bar cu-notice-bar-round warning')
  })
})
