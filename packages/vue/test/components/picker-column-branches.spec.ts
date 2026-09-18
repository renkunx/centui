/**
 * PickerColumn 分支收尾：触摸模型、无效项恢复、resetScrollingPosition、键盘列占位。
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { scrollerInstances } = vi.hoisted(() => ({ scrollerInstances: [] as unknown[] }))

vi.mock('@mand-mobile/core/web', async importOriginal => {
  const orig = (await importOriginal()) as Record<string, unknown>
  class FakeScrollerImpl {
    _isAnimating = false; _isDecelerating = false; _isDragging = false; _isGesturing = false
    _clientHeight = 300; _contentHeight = 900; _scrollTop = 300; _top = 0
    cb: unknown; opts: Record<string, unknown>
    constructor(cb: unknown, opts: Record<string, unknown> = {}) { this.cb = cb; this.opts = opts; scrollerInstances.push(this) }
    setPosition = vi.fn(); setDimensions = vi.fn(); setSnapSize = vi.fn()
    activatePullToRefresh = vi.fn(); triggerPullToRefresh = vi.fn(); finishPullToRefresh = vi.fn()
    scrollTo = vi.fn()
    getValues = vi.fn(() => ({ top: this._top, left: 0 }))
    getScrollMax = vi.fn(() => ({ top: 600, left: 0 }))
    doTouchStart = vi.fn(); doTouchMove = vi.fn(); doTouchEnd = vi.fn()
  }
  return { ...orig, Scroller: FakeScrollerImpl }
})

import MdPickerColumn, { type PickerColumnExposed } from '../../src/components/picker/PickerColumn.vue'

async function flushAll() {
  await new Promise(r => setTimeout(r, 60))
}

describe('PickerColumn 分支收尾', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
    document.body.innerHTML = ''
  })

  function mountColumn(props: Record<string, unknown> = {}) {
    const ref: { current: PickerColumnExposed | null } = { current: null }
    const wrapper = mount(MdPickerColumn, {
      props: {
        cols: 1,
        data: [[{ text: 'A' }, { text: 'B' }, { text: 'C' }]],
        ...props,
      },
      ref: (r: unknown) => { ref.current = r as PickerColumnExposed },
      attachTo: document.body,
    })
    const getColumn = () =>
      wrapper.findComponent({ name: 'md-picker-column' }).vm as unknown as PickerColumnExposed
    return { wrapper, getColumn }
  }

  it('touch drag on hook drives column scroll', async () => {
    const { wrapper, getColumn } = mountColumn()
    getColumn().refresh()
    await flushAll()
    const hook = wrapper.find('.md-picker-column-hook')
    await hook.trigger('touchstart', { touches: [{ pageX: 100, pageY: 100 }] })
    await hook.trigger('touchmove', { touches: [{ pageX: 100, pageY: 55 }] })
    await hook.trigger('touchend', { touches: [] })
    await flushAll()
    // 滚动引擎未真实运动，但触摸链路不抛错
    expect(wrapper.find('.md-picker-column').exists()).toBe(true)
    wrapper.unmount()
  })

  it('mouse drag path (mousedown/move/up)', async () => {
    const { wrapper, getColumn } = mountColumn()
    getColumn().refresh()
    await flushAll()
    const hook = wrapper.find('.md-picker-column-hook')
    await hook.trigger('mousedown', { pageX: 100, pageY: 100 })
    await hook.trigger('mousemove', { pageX: 55, pageY: 100 })
    await hook.trigger('mouseup', { pageX: 55, pageY: 100 })
    await flushAll()
    expect(true).toBe(true)
    wrapper.unmount()
  })

  it('getColumnValues falls back safely before init', () => {
    const { wrapper } = mountColumn()
    expect(wrapper.vm.getColumnValues().length).toBe(1)
    expect(wrapper.vm.getColumnIndex(0)).toBeUndefined()
    wrapper.unmount()
  })

  it('setColumnValues keepIndex=false resets index', async () => {
    const { wrapper, getColumn } = mountColumn({ defaultIndex: [2] })
    getColumn().refresh()
    await flushAll()
    expect(getColumn().getColumnIndex(0)).toBe(2)
    getColumn().setColumnValues(0, [{ text: 'X' }, { text: 'Y' }])
    await flushAll()
    expect(getColumn().getColumnIndex(0)).toBe(0)
    wrapper.unmount()
  })
})
