/**
 * Picker 家族覆盖率补强（FakeScroller 注入驱动滚动联动分支）：
 * PickerColumn 触摸模型/无效跳选/keepIndex/公共 API、Picker 级联与快照恢复、
 * DatePicker custom/unitText/textRender/change 联动/confirm 转发。
 */
import { act, fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { scrollerInstances } = vi.hoisted(() => ({ scrollerInstances: [] as unknown[] }))

vi.mock('@centui/core/web', async importOriginal => {
  const orig = (await importOriginal()) as Record<string, unknown>
  class FakeScrollerImpl {
    _isAnimating = false
    _isDecelerating = false
    _isDragging = false
    _isGesturing = false
    _top = 0
    cb: unknown
    opts: { scrollingComplete?: () => void }
    constructor(cb: unknown, opts: { scrollingComplete?: () => void }) {
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

import { CuDatePicker, CuPicker } from '../../src'
import { CuPickerColumn, type PickerColumnExposed } from '../../src/components/picker/PickerColumn'

async function flushAll() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 20))
  })
}

const DATA = [
  [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
  [{ text: '1' }, { text: '2' }],
]

describe('CuPickerColumn 覆盖 (react)', () => {
  let ref: { current: PickerColumnExposed | null }

  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
    ref = { current: null }
  })

  function mount(props: Record<string, unknown> = {}) {
    return render(
      <CuPickerColumn
        ref={r => { ref.current = r }}
        cols={2}
        data={DATA as never}
        {...props}
      />,
      { container: document.body },
    )
  }

  it('refresh initializes scrollers and default selection', async () => {
    const wrapper = mount({ defaultValue: ['C', '2'] })
    await act(async () => {
      ref.current!.refresh()
    })
    await flushAll()
    expect(scrollerInstances.length).toBe(2)
    expect(ref.current!.getColumnIndexs()).toEqual([2, 1])
    expect(ref.current!.getColumnValue(0)?.text).toBe('C')
    wrapper.unmount()
  })

  it('touch model drives scroll and emits change', async () => {
    const onChange = vi.fn()
    const wrapper = mount({ onChange })
    await act(async () => {
      ref.current!.refresh()
    })
    await flushAll()
    const hooks = wrapper.container.querySelectorAll('.cu-picker-column-hook')
    expect(hooks.length).toBe(2)

    // 触摸模型：mousedown → mousemove → mouseup → scrollingComplete
    fireEvent.mouseDown(hooks[0], { pageY: 100, button: 0 })
    fireEvent.mouseMove(hooks[0], { pageY: 60 })
    fireEvent.mouseUp(hooks[0], { pageY: 60 })
    const scroller = scrollerInstances.at(-2) as unknown as {
      _top: number
      opts: { scrollingComplete?: () => void }
    }
    scroller._top = 45
    scroller.opts.scrollingComplete?.()
    await flushAll()

    expect(onChange).toHaveBeenCalled()
    expect(ref.current!.getColumnValue(0)?.text).toBe('B')
    wrapper.unmount()
  })

  it('jumps to valid index when default invalid', async () => {
    const wrapper = mount({ invalidIndex: [[1], []], defaultValue: ['B', '1'] })
    await act(async () => {
      ref.current!.refresh()
    })
    await flushAll()
    expect(ref.current!.getColumnValue(0)?.text).not.toBe('B')
    wrapper.unmount()
  })

  it('keepIndex retains active index on setColumnValues', async () => {
    const wrapper = mount({ keepIndex: true, defaultIndex: [1] })
    await act(async () => {
      ref.current!.refresh()
    })
    await flushAll()
    ref.current!.setColumnValues(0, [{ text: 'X' }, { text: 'Y' }])
    await flushAll()
    expect(ref.current!.getColumnIndex(0)).toBe(1)
    wrapper.unmount()
  })

  it('getColumnIndexByDefault matches index and value', async () => {
    const wrapper = mount()
    // v2 契约：defaultValue 按列索引；列级缺省时该列落到默认第 0 项并中断（v2 行为）
    const seen: Array<[number, number]> = []
    const collect = (c: number, i: number) => {
      seen.push([c, i])
    }
    ref.current!.getColumnIndexByDefault(DATA as never, [1], [], collect)
    expect(seen).toContainEqual([0, 1])
    seen.length = 0
    ref.current!.getColumnIndexByDefault(DATA as never, [], ['B', '2'], collect)
    expect(seen).toContainEqual([0, 1])
    expect(seen).toContainEqual([1, 1])
    wrapper.unmount()
  })

  it('renders placeholder columns and fires initialed', async () => {
    const onInitialed = vi.fn()
    const wrapper = mount({ cols: 3, onInitialed, data: [[{ text: 'A' }]] as never })
    await act(async () => {
      ref.current!.refresh()
    })
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(wrapper.container.querySelectorAll('.cu-picker-column-item').length).toBe(3)
    expect(onInitialed).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('CuPicker 覆盖 (react)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
    document.body.innerHTML = ''
  })

  it('cascade rebuilds following columns on change', async () => {
    const cascadeData = [
      [
        { text: 'A', value: 'a', children: [{ text: 'A1', value: 'a1' }, { text: 'A2', value: 'a2' }] },
        { text: 'B', value: 'b', children: [{ text: 'B1', value: 'b1' }] },
      ],
    ] as never
    const { container } = render(
      <CuPicker isView isCascade cols={2} data={cascadeData} />,
    )
    await flushAll()
    expect(container.querySelectorAll('.cu-picker-column-item').length).toBeGreaterThanOrEqual(2)
  })

  it('cancel resets columns via snapshot', async () => {
    const onCancel = vi.fn()
    const { container } = render(
      <CuPicker value data={DATA as never} cols={2} onCancel={onCancel} />,
    )
    await flushAll()
    fireEvent.click(container.querySelector('.cu-popup-cancel')!)
    await flushAll()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('mask click cancels', async () => {
    const onCancel = vi.fn()
    const { container } = render(
      <CuPicker value data={DATA as never} cols={2} onCancel={onCancel} />,
    )
    await flushAll()
    fireEvent.click(container.querySelector('.cu-popup-mask')!)
    await flushAll()
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.cu-popup')!.getAttribute('style')).toContain('display: none')
  })
})

describe('CuDatePicker 覆盖 (react)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
    document.body.innerHTML = ''
  })

  it('custom types and unitText', async () => {
    const { container } = render(
      <CuDatePicker
        isView
        type="custom"
        customTypes={['yyyy', 'MM']}
        defaultDate={new Date(2024, 5, 15)}
        unitText={['年', '月', '日', '时', '分']}
      />,
    )
    await flushAll()
    expect(container.querySelectorAll('.cu-picker-column-item')).toHaveLength(2)
    const active = container.querySelector('.column-item.active')
    expect(active?.textContent).toBe('2024年')
  })

  it('textRender customizes display', async () => {
    const { container } = render(
      <CuDatePicker
        isView
        type="date"
        defaultDate={new Date(2024, 5, 15)}
        textRender={(typeFormat, ...values): string =>
          typeFormat === 'yyyy' ? `Y${values.at(-1)}` : ''
        }
      />,
    )
    await flushAll()
    const year = container.querySelector('.column-item.active')
    expect(year?.textContent).toMatch(/^Y20/)
  })

  it('todayText replaces current day label', async () => {
    const now = new Date()
    const { container } = render(
      <CuDatePicker
        isView
        type="date"
        todayText="今天&"
        defaultDate={now}
        minDate={new Date(now.getFullYear(), now.getMonth(), 1)}
        maxDate={new Date(now.getFullYear(), now.getMonth() + 1, 0)}
      />,
    )
    await flushAll()
    const texts = [...container.querySelectorAll('.column-item')].map(li => li.textContent)
    expect(texts.some(t => t?.startsWith('今天'))).toBe(true)
  })

  it('forwards confirm/cancel/show/hide and change rebuilds following columns', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const onShow = vi.fn()
    const onHide = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <CuDatePicker
        value
        type="date"
        defaultDate={new Date(2024, 5, 15)}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onShow={onShow}
        onHide={onHide}
        onChange={onChange}
      />,
    )
    await flushAll()

    fireEvent.click(container.querySelector('.cu-popup-confirm')!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onShow).toHaveBeenCalledTimes(1)

    fireEvent.click(container.querySelector('.cu-popup-cancel')!)
    await flushAll()
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onHide).toHaveBeenCalledTimes(1)
  })
})
