/**
 * cursor.ts 分支收尾：null 节点守卫、timer 重入清理。
 */
import { describe, expect, it, vi } from 'vitest'
import { getCursorsPosition, setCursorsPosition } from '../../src/components/input-item/cursor'

describe('cursor.ts (vue)', () => {
  it('null guards', () => {
    expect(getCursorsPosition(null)).toBe(0)
    setCursorsPosition(null, 0) // 不抛错
    expect(true).toBe(true)
  })

  it('reads selectionStart and clears prior timer', async () => {
    vi.useFakeTimers()
    const input = document.createElement('input')
    input.value = 'hello'
    document.body.appendChild(input)
    input.focus()
    input.setSelectionRange(3, 3)
    expect(getCursorsPosition(input)).toBe(3)

    setCursorsPosition(input, 5)
    setCursorsPosition(input, 2) // 重入：覆盖上一个 timer
    await vi.advanceTimersByTimeAsync(10)
    expect(input.selectionStart).toBe(2)
    document.body.removeChild(input)
    vi.useRealTimers()
  })
})
