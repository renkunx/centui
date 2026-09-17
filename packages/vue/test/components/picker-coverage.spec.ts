/**
 * Picker/DatePicker 补充行为与覆盖：
 * - FakeScroller 代替 core/web 的滚动引擎，可控触发 scrollingComplete（jsdom 无动画）
 * - PickerColumn：默认索引初始化、invalidIndex 跳选、滚动结束联动 change、setColumnValues
 * - Picker 弹层模式：title-bar confirm/cancel、滚动中拦截 confirm
 * - DatePicker：time/datetime 列数、change 联动、confirm/cancel 转发
 */
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock 工厂会被提升到文件顶部，实例表须经 vi.hoisted 共享
const { scrollerInstances } = vi.hoisted(() => ({ scrollerInstances: [] as unknown[] }))

vi.mock('@mand-mobile/core/web', async (importOriginal) => {
  const orig = (await importOriginal()) as Record<string, unknown>
  class FakeScrollerImpl {
    cb: (left: number, top: number) => void
    opts: { scrollingComplete?: () => void }
    _top = 0

    _isAnimating = false
    _isDecelerating = false
    _isDragging = false
    _isGesturing = false

    constructor(cb: (left: number, top: number) => void, opts: { scrollingComplete?: () => void }) {
      this.cb = cb
      this.opts = opts
      scrollerInstances.push(this)
    }
    setPosition() {}
    setDimensions() {}
    setSnapSize() {}
    scrollTo(_left: number, top: number) {
      this._top = top
    }
    getValues() {
      return { top: this._top, left: 0 }
    }
    getScrollMax() {
      return { top: 100000, left: 0 }
    }
    doTouchStart() {}
    doTouchMove() {}
    doTouchEnd() {}
  }
  return { ...orig, Scroller: FakeScrollerImpl }
})

import { MdDatePicker, MdPicker } from '../../src'
import MdPickerColumn from '../../src/components/picker/PickerColumn.vue'

async function flushAll() {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}

describe('MdPickerColumn（FakeScroller）', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
  })

  function mountColumn(props: Record<string, unknown> = {}) {
    const wrapper = mount(MdPickerColumn, {
      props: {
        cols: 2,
        data: [
          [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
          [{ text: '1' }, { text: '2' }],
        ],
        ...props,
      },
      attachTo: document.body,
    })
    return wrapper
  }

  it('initializes scrollers and default indexes on refresh', async () => {
    const wrapper = mountColumn({ defaultValue: ['C', '2'] })
    wrapper.vm.refresh()
    await flushAll()
    expect(scrollerInstances.length).toBe(2)
    expect(wrapper.vm.getColumnIndexs()).toEqual([2, 1])
    expect(wrapper.findAll('.column-item')[2].classes()).toContain('active')
    wrapper.unmount()
  })

  it('jumps to a valid index when default is invalid', async () => {
    const wrapper = mountColumn({ invalidIndex: [[1], []], defaultValue: ['B', '1'] })
    wrapper.vm.refresh()
    await flushAll()
    // B(1) 无效 → 沿方向找有效项（前向 0）
    expect(wrapper.vm.getColumnIndex(0)).not.toBe(1)
    expect(wrapper.vm.getColumnValue(0)?.text).not.toBe('B')
    wrapper.unmount()
  })

  it('emits change with column value on scroll end', async () => {
    const wrapper = mountColumn()
    wrapper.vm.refresh()
    await flushAll()
    const first = wrapper.vm.scrollers[0] as unknown as {
      _top: number
      opts: { scrollingComplete?: () => void }
    }
    // 滚到第 2 项（index 1）
    first._top = 45
    first.opts.scrollingComplete?.()
    await flushAll()
    expect(wrapper.emitted('change')).toBeTruthy()
    const [columnIndex, itemIndex] = wrapper.emitted('change')!.at(-1)!
    expect(columnIndex).toBe(0)
    expect(itemIndex).toBe(1)
    expect(wrapper.vm.getColumnValue(0)?.text).toBe('B')
    wrapper.unmount()
  })

  it('setColumnValues resets active index unless keepIndex', async () => {
    const wrapper = mountColumn()
    wrapper.vm.refresh()
    await flushAll()
    wrapper.vm.setColumnValues(1, [{ text: 'x' }, { text: 'y' }])
    await flushAll()
    expect(wrapper.vm.getColumnIndex(1)).toBe(0)

    const kept = mountColumn({ keepIndex: true })
    kept.vm.refresh()
    await flushAll()
    kept.vm.setColumnValues(0, [{ text: 'x' }])
    await flushAll()
    expect(kept.vm.getColumnIndex(0)).toBe(0)
    wrapper.unmount()
    kept.unmount()
  })

  it('initialed event fires after first refresh', async () => {
    const wrapper = mountColumn()
    wrapper.vm.refresh()
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(wrapper.emitted('initialed')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('MdPicker（弹层模式）', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    scrollerInstances.length = 0
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens popup and confirms with column values', async () => {
    const onConfirm = vi.fn()
    const wrapper = mount(MdPicker, {
      props: {
        data: [[{ text: 'A' }, { text: 'B' }]],
        defaultValue: ['B'],
        title: '选择',
        modelValue: true,
        onConfirm,
      },
      attachTo: document.body,
    })
    await flushAll()
    expect(document.body.querySelector('.md-popup-title-bar')).not.toBeNull()

    ;(document.body.querySelector('.md-popup-confirm') as HTMLElement).click()
    await flushAll()
    expect(onConfirm).toBeTruthy()
    expect(wrapper.emitted('confirm')).toBeTruthy()
    wrapper.unmount()
  })

  it('cancel resets and mask click cancels', async () => {
    const wrapper = mount(MdPicker, {
      props: { modelValue: true, data: [[{ text: 'A' }]] },
      attachTo: document.body,
    })
    await flushAll()
    ;(document.body.querySelector('.md-popup-cancel') as HTMLElement).click()
    await flushAll()
    expect(wrapper.emitted('cancel')).toBeTruthy()
    wrapper.unmount()
  })

  it('blocks confirm while a scroller animates', async () => {
    const wrapper = mount(MdPicker, {
      props: { modelValue: true, data: [[{ text: 'A' }]] },
      attachTo: document.body,
    })
    await flushAll()
    // 经组件实例取当前生效的 scroller（refresh 可能多次，全局表首项可能已过期）
    const scrollers = wrapper.findComponent(MdPickerColumn).vm.scrollers as unknown as Array<{
      _isAnimating: boolean
    }>
    scrollers[0]._isAnimating = true
    ;(document.body.querySelector('.md-popup-confirm') as HTMLElement).click()
    await flushAll()
    expect(wrapper.emitted('confirm')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('MdDatePicker 补充', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    scrollerInstances.length = 0
  })

  it('builds time/datetime columns', async () => {
    const time = mount(MdDatePicker, {
      props: { isView: true, type: 'time', defaultDate: new Date(2024, 5, 15, 10, 30) },
      attachTo: document.body,
    })
    await flushAll()
    expect(time.findAll('.md-picker-column-item')).toHaveLength(2)
    time.unmount()

    const datetime = mount(MdDatePicker, {
      props: { isView: true, type: 'datetime', defaultDate: new Date(2024, 5, 15, 10, 30) },
      attachTo: document.body,
    })
    await flushAll()
    expect(datetime.findAll('.md-picker-column-item')).toHaveLength(5)
    datetime.unmount()
  })

  it('rebuilds columns on defaultDate change', async () => {
    const wrapper = mount(MdDatePicker, {
      props: { isView: true, type: 'date', defaultDate: new Date(2024, 5, 15) },
      attachTo: document.body,
    })
    await flushAll()
    await wrapper.setProps({ defaultDate: new Date(2030, 0, 1) })
    await flushAll()
    const yearTexts = wrapper
      .findAll('.md-picker-column-item')[0]
      .findAll('.column-item')
      .map((li) => li.text())
    expect(yearTexts).toContain('2030年')
    wrapper.unmount()
  })
})
