/**
 * DatePicker 分支覆盖（Vue）：change 联动重建后续列（initColumnData 全分支）。
 * FakeScroller 驱动列滚动完成 → onChange → initColumnData。
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'


const { scrollerInstances } = vi.hoisted(() => ({ scrollerInstances: [] as unknown[] }))

vi.mock('@centui/core/web', async importOriginal => {
  const orig = (await importOriginal()) as Record<string, unknown>
  class FakeScrollerImpl {
    _isAnimating = false
    _isDecelerating = false
    _isDragging = false
    _isGesturing = false
    _clientHeight = 300
    _contentHeight = 900
    _scrollTop = 300
    _top = 0
    cb: unknown
    opts: Record<string, unknown>
    constructor(cb: unknown, opts: Record<string, unknown> = {}) {
      this.cb = cb
      this.opts = opts
      scrollerInstances.push(this)
    }
    setPosition = vi.fn()
    setDimensions = vi.fn()
    setSnapSize = vi.fn()
    activatePullToRefresh = vi.fn()
    triggerPullToRefresh = vi.fn()
    finishPullToRefresh = vi.fn()
    scrollTo = vi.fn()
    getValues = vi.fn(() => ({ top: this._top, left: 0 }))
    getScrollMax = vi.fn(() => ({ top: 600, left: 0 }))
    doTouchStart = vi.fn()
    doTouchMove = vi.fn()
    doTouchEnd = vi.fn()
  }
  return { ...orig, Scroller: FakeScrollerImpl }
})

import { CuDatePicker } from '../../src'

const onChangeSpy = vi.fn()

async function realFlush(ms = 80) {
  await new Promise(r => setTimeout(r, ms))
}

describe('CuDatePicker change 联动 (vue)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
    document.body.innerHTML = ''
    onChangeSpy.mockClear()
  })

  it('change on year column rebuilds following columns', async () => {
        const wrapper = mount({
      components: { CuDatePicker },
      template: `
        <CuDatePicker
          ref="dp"
          is-view
          type="date"
          :default-date="new Date(2024, 5, 15)"
          :min-date="new Date(2020, 0, 1)"
          :max-date="new Date(2030, 11, 31)"
          @change="onChange"
        />
      `,
      setup() {
        return { onChange: onChangeSpy }
      },
    })
    await realFlush(60)
    expect(wrapper.findAll('.cu-picker-column-item')).toHaveLength(3)
    onChangeSpy.mockClear()

    // 年列滚到 2030（第 10 项）：index 10 × 45
    const yearScroller = scrollerInstances[0] as unknown as {
      _top: number
      opts: { scrollingComplete?: () => void }
    }
    yearScroller._top = 10 * 45
    yearScroller.opts.scrollingComplete?.()
    await realFlush()

    expect(onChangeSpy).toHaveBeenCalled()
    const [columnIndex] = onChangeSpy.mock.calls[0]
    expect(columnIndex).toBe(0)
    // 月/日列按 2030 年重建 → 各 12/31 项
    const columns = wrapper.findAll('.cu-picker-column-item')
    const monthCount = columns[1].element.querySelectorAll('.column-item').length
    expect(monthCount).toBe(12)
  })
})

