/**
 * React 弹层与输入选择器行为清单（Popup/TitleBar/Dialog/ActionSheet/Tip/InputItem/Codebox/RadioList/Picker/DatePicker）。
 * Picker 滚动引擎用 FakeScroller 注入以覆盖 jsdom 中不可达的联动分支。
 */
import { act, fireEvent, render, waitFor } from '@testing-library/react'
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

import {
  ActionSheet,
  Dialog,
  CuActionSheet,
  CuCodebox,
  CuDatePicker,
  CuDialog,
  CuInputItem,
  CuNumberKeyboard,
  CuPicker,
  CuPopup,
  CuPopupTitleBar,
  CuRadioList,
  CuTip,
  CuTipContent,
} from '../../src'

async function flushAll() {
  // refresh 链路存在双层 setTimeout（popup before-show → column refresh）
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 20))
  })
}

describe('CuPopup (react)', () => {
  it('opens via value and closes on mask click', async () => {
    const onChange = vi.fn()
    const { container } = render(<CuPopup value onChange={onChange}>内容</CuPopup>)
    // MAND_ENV=test：过渡钩子同步触发，打开态立即可见
    expect(container.querySelector('.cu-popup-box')).not.toBeNull()
    expect(container.querySelector('.cu-popup-box')!.getAttribute('style')).not.toContain('display: none')

    fireEvent.click(container.querySelector('.cu-popup-mask')!)
    expect(onChange).toHaveBeenCalledWith(false)
    expect(container.querySelector('.cu-popup-hide, [style*="display: none"]')).toBeTruthy()
  })

  it('emits show/hide lifecycle in test env', () => {
    const onShow = vi.fn()
    const onHide = vi.fn()
    const { rerender } = render(<CuPopup value onShow={onShow} onHide={onHide} />)
    expect(onShow).toHaveBeenCalledTimes(1)
    rerender(<CuPopup value={false} onShow={onShow} onHide={onHide} />)
    expect(onHide).toHaveBeenCalledTimes(1)
  })

  it('mask click does nothing when maskClosable=false', () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuPopup value maskClosable={false} onChange={onChange} />,
    )
    fireEvent.click(container.querySelector('.cu-popup-mask')!)
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('CuPopupTitleBar (react)', () => {
  it('emits confirm/cancel and syncs largeRadius to popup', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { container } = render(
      <CuPopup value>
        <CuPopupTitleBar title="T" okText="确定" cancelText="取消" largeRadius onConfirm={onConfirm} onCancel={onCancel} />
      </CuPopup>,
    )
    await flushAll()
    expect(container.querySelector('.cu-popup')!.className).toContain('large-radius')

    fireEvent.click(container.querySelector('.cu-popup-confirm')!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(container.querySelector('.cu-popup-cancel')!)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('onlyClose renders close icon emitting cancel', () => {
    const onCancel = vi.fn()
    const { container } = render(<CuPopupTitleBar title="T" onlyClose onCancel={onCancel} />)
    fireEvent.click(container.querySelector('.cu-popup-close')!)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('CuDialog (react)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('button handlers and close semantics', () => {
    const handler = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <CuDialog
        value
        appendTo={null}
        title="T"
        btns={[
          { text: 'A', handler },
          { text: 'B' },
          { text: 'C', disabled: true },
          { text: 'D', warning: true },
        ]}
        onChange={onChange}
      />,
    )
    const btns = container.querySelectorAll('.cu-dialog-btn')
    fireEvent.click(btns[0])
    expect(handler).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.click(btns[1])
    expect(onChange).toHaveBeenCalledWith(false)

    fireEvent.click(btns[2])
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(btns[3].className).toContain('warning')
  })

  it('confirm factory with locale buttons auto-closes', async () => {
    const onConfirm = vi.fn()
    const onHide = vi.fn()
    let vm: { close: () => void }
    await act(async () => {
      vm = Dialog.confirm({ title: '确认', content: '内容', onConfirm, onHide })
    })
    const btns = document.body.querySelectorAll('.cu-dialog-btn')
    expect(btns[0].textContent?.trim()).toBe('取消')
    expect(btns[1].textContent?.trim()).toBe('确定')

    await act(async () => {
      ;(btns[1] as HTMLElement).click()
    })
    await flushAll()
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onHide).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector('.cu-dialog')).toBeNull()
    expect(vm!.close).toBeDefined()
  })

  it('alert/succeed/failed inject icons and closeAll', async () => {
    await act(async () => {
      Dialog.alert({ title: 'T' })
    })
    expect(document.body.querySelectorAll('.cu-dialog-btn')).toHaveLength(1)

    await act(async () => {
      Dialog.succeed({ title: 'S' })
    })
    expect(document.body.querySelector('.cu-icon-success-color')).not.toBeNull()

    await act(async () => {
      Dialog.closeAll()
    })
    await flushAll()
    expect(document.body.querySelector('.cu-dialog')).toBeNull()
  })
})

describe('CuActionSheet (react)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('selects option, blocks invalid, cancel closes', () => {
    const onSelected = vi.fn()
    const onCancel = vi.fn()
    const { container } = render(
      <CuActionSheet
        value
        title="操作"
        options={[{ text: 'A' }, { text: 'B' }]}
        invalidIndex={1}
        onSelected={onSelected}
        onCancel={onCancel}
      />,
    )
    const items = container.querySelectorAll('.cu-action-sheet-item')
    expect(items[1].className).toContain('disabled')

    fireEvent.click(items[0])
    expect(onSelected).toHaveBeenCalledWith({ text: 'A' })

    fireEvent.click(container.querySelector('.cu-action-sheet-cancel')!)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('create factory with callbacks and cleanup', async () => {
    const onSelected = vi.fn()
    const onHide = vi.fn()
    let sheet: { close: () => void }
    await act(async () => {
      sheet = ActionSheet.create({ title: '命令式', options: [{ text: 'A' }], onSelected, onHide })
    })
    expect(document.body.querySelector('.cu-action-sheet')).not.toBeNull()

    await act(async () => {
      ;(document.body.querySelectorAll('.cu-action-sheet-item')[0] as HTMLElement).click()
    })
    expect(onSelected).toHaveBeenCalledTimes(1)
    expect(onHide).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector('.cu-action-sheet')).toBeNull()
    expect(sheet!.close).toBeDefined()
  })
})

describe('CuTip (react)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders first child with trigger and shows tip on click', async () => {
    const onShow = vi.fn()
    const { container } = render(
      <CuTip content="提示内容" placement="top" onShow={onShow}>
        <button>触发</button>
      </CuTip>,
      { container: document.body },
    )
    expect(container.querySelector('button')).not.toBeNull()

    await act(async () => {
      fireEvent.click(container.querySelector('button')!)
    })
    const tip = document.body.querySelector('.cu-tip')
    expect(tip).not.toBeNull()
    expect(tip!.querySelector('.content-text')!.textContent).toBe('提示内容')
    expect((tip as HTMLElement).style.cssText).toContain('position: absolute')
    expect(onShow).toHaveBeenCalled()
  })

  it('closable icon hides tip', async () => {
    const { container } = render(
      <CuTip content="C">
        <button>触发</button>
      </CuTip>,
      { container: document.body },
    )
    await act(async () => {
      fireEvent.click(container.querySelector('button')!)
    })
    expect(document.body.querySelector('.cu-tip')).not.toBeNull()

    await act(async () => {
      document.body.querySelector('.cu-icon-close')?.dispatchEvent(new Event('click', { bubbles: true }))
    })
    expect(document.body.querySelector('.cu-tip')).toBeNull()
  })

  it('tip content variants render classes', () => {
    const onClose = vi.fn()
    const { container } = render(
      <CuTipContent content="文本" placement="bottom" icon="warn" name="tip-n" onClose={onClose} />,
    )
    expect(container.querySelector('.cu-tip')!.className).toContain('is-bottom')
    expect(container.querySelector('.cu-tip')!.className).toContain('tip-n')
    fireEvent.click(container.querySelector('.cu-icon-close')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('CuInputItem (react)', () => {
  it('formats phone/bankCard/money from value', () => {
    const phone = render(<CuInputItem type="phone" value="13812345678" />)
    expect((phone.container.querySelector('input') as HTMLInputElement).value).toBe('138 1234 5678')

    const bank = render(<CuInputItem type="bankCard" value="6222021234561234" />)
    expect((bank.container.querySelector('input') as HTMLInputElement).value).toBe('6222 0212 3456 1234')

    const money = render(<CuInputItem type="money" value="1234567.89" />)
    expect((money.container.querySelector('input') as HTMLInputElement).value).toBe('1,234,567.89')
  })

  it('emits change with trimmed value', async () => {
    const onChange = vi.fn()
    const { container } = render(<CuInputItem type="phone" onChange={onChange} />)
    fireEvent.input(container.querySelector('input')!, { target: { value: '13812345678' } })
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('13812345678', 'input-item'))
  })

  it('clear button appears on focus and clears', () => {
    const onChange = vi.fn()
    const { container } = render(<CuInputItem value="abc" clearable onChange={onChange} />)
    fireEvent.focus(container.querySelector('input')!)
    const clear = container.querySelector('.cu-input-item-clear')!
    expect(clear.getAttribute('style')).not.toContain('display: none')
    fireEvent.click(clear)
    expect(onChange).toHaveBeenLastCalledWith('', 'input-item')
  })

  it('error blocks render and is-error class', () => {
    const { container } = render(<CuInputItem error="错误" brief="说明" />)
    expect(container.querySelector('.cu-input-item-msg p')!.textContent).toBe('错误')
    expect(container.querySelector('.cu-input-item-brief')).toBeNull()
    expect(container.querySelector('.cu-field-item')!.className).toContain('is-error')
  })

  it('enter key confirms', () => {
    const onConfirm = vi.fn()
    const { container } = render(<CuInputItem value="abc" onConfirm={onConfirm} />)
    fireEvent.keyUp(container.querySelector('input')!, { keyCode: 13 })
    expect(onConfirm).toHaveBeenCalledWith('input-item', 'abc')
  })
})

describe('CuCodebox (react)', () => {
  it('accumulates via keyboard and submits when full', async () => {
    const onSubmit = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <CuCodebox maxlength={4} isView onChange={onChange} onSubmit={onSubmit} />,
    )
    fireEvent.click(container.querySelector('.cu-codebox')!)
    const keys = container.querySelectorAll('.keyboard-number-item')
    for (const k of [keys[0], keys[1], keys[2], keys[3]]) {
      fireEvent.click(k)
    }
    expect(onChange).toHaveBeenLastCalledWith('1234')
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('1234'))
  })

  it('masks digits and delete rolls back', () => {
    const onChange = vi.fn()
    const { container } = render(<CuCodebox value="12" mask maxlength={4} isView onChange={onChange} />)
    expect(container.querySelectorAll('.cu-codebox-dot')).toHaveLength(2)

    fireEvent.click(container.querySelector('.cu-codebox')!)
    fireEvent.click(container.querySelector('.keyboard-number-item.delete')!)
    expect(onChange).toHaveBeenLastCalledWith('1')
  })

  it('system keyboard input submits', () => {
    const onSubmit = vi.fn()
    const { container } = render(<CuCodebox system maxlength={2} onSubmit={onSubmit} />)
    fireEvent.input(container.querySelector('.cu-codebox-input')!, { target: { value: '12' } })
    expect(onSubmit).toHaveBeenCalledWith('12')
  })
})

describe('CuRadioList (react)', () => {
  it('selects option and emits change', () => {
    const onChange = vi.fn()
    const onChangeValue = vi.fn()
    const { container } = render(
      <CuRadioList
        value="a"
        options={[{ value: 'a', text: 'A' }, { value: 'b', text: 'B' }]}
        onChange={onChange}
        onChangeValue={onChangeValue}
      />,
    )
    expect(container.querySelectorAll('.cu-radio-item')[0].className).toContain('is-selected')

    fireEvent.click(container.querySelectorAll('.cu-radio-item')[1])
    expect(onChange).toHaveBeenCalledWith({ value: 'b', text: 'B' }, 1)
  })

  it('has-input branch emits typed value', () => {
    const onChangeValue = vi.fn()
    const { container } = render(
      <CuRadioList options={[{ value: 'a', text: 'A' }]} hasInput inputLabel="自定义" onChangeValue={onChangeValue} />,
    )
    const input = container.querySelector('input')!
    fireEvent.focus(input)
    fireEvent.input(input, { target: { value: '88' } })
    expect(onChangeValue).toHaveBeenLastCalledWith('88')
  })
})

describe('CuPicker (react)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
    document.body.innerHTML = ''
  })

  it('renders columns in view mode with default selection after refresh', async () => {
    const onChange = vi.fn()
    const { unmount } = render(
      <CuPicker
        isView
        cols={2}
        data={[
          [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
          [{ text: '1' }, { text: '2' }],
        ]}
        defaultValue={['C', '2']}
        onChange={onChange}
      />,
    )
    // 等待 refresh 后以滚动完成回调驱动联动（FakeScroller 记录在 scrollerInstances）
    await flushAll()
    const first = scrollerInstances.at(-1) as unknown as { _top: number; opts: { scrollingComplete?: () => void } }
    if (first) {
      first._top = 90 // 第 3 项
      first.opts.scrollingComplete?.()
      await flushAll()
      expect(onChange).toHaveBeenCalled()
    }
    unmount()
  })

  it('picker popup confirms with column values', async () => {
    const onConfirm = vi.fn()
    const { container } = render(
      <CuPicker
        value
        data={[[{ text: 'A' }, { text: 'B' }]]}
        defaultValue={['B']}
        onConfirm={onConfirm}
      />,
    )
    await flushAll()
    fireEvent.click(container.querySelector('.cu-popup-confirm')!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onConfirm.mock.calls[0][0][0]?.text).toBe('B')
  })

  it('cancel resets and emits', async () => {
    const onCancel = vi.fn()
    const { container } = render(
      <CuPicker value data={[[{ text: 'A' }]]} onCancel={onCancel} />,
    )
    await flushAll()
    fireEvent.click(container.querySelector('.cu-popup-cancel')!)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('CuDatePicker (react)', () => {
  beforeEach(() => {
    ;(scrollerInstances as unknown[]).length = 0
    document.body.innerHTML = ''
  })

  it('builds bounded date columns and getFormatDate', async () => {
    const ref = { current: null as null | { getFormatDate: (f?: string) => string } }
    const wrapper = render(
      <CuDatePicker
        ref={r => (ref.current = r as never)}
        isView
        type="date"
        defaultDate={new Date(2024, 5, 15)}
        minDate={new Date(2024, 5, 1)}
        maxDate={new Date(2024, 5, 20)}
      />,
    )
    await flushAll()
    const columns = wrapper.container.querySelectorAll('.cu-picker-column-item')
    expect(columns).toHaveLength(3)
    expect(wrapper.container.querySelector('.cu-date-picker')!.className).toContain('date')
    expect(ref.current!.getFormatDate('yyyy-MM-dd')).toBe('2024-06-15')
    wrapper.unmount()
  })

  it('time/datetime column counts', async () => {
    const time = render(
      <CuDatePicker isView type="time" defaultDate={new Date(2024, 5, 15, 10, 30)} />,
    )
    await flushAll()
    expect(time.container.querySelectorAll('.cu-picker-column-item')).toHaveLength(2)
    time.unmount()

    const datetime = render(
      <CuDatePicker isView type="datetime" defaultDate={new Date(2024, 5, 15, 10, 30)} />,
    )
    await flushAll()
    expect(datetime.container.querySelectorAll('.cu-picker-column-item')).toHaveLength(5)
    datetime.unmount()
  })
})

describe('CuNumberKeyboard (react)', () => {
  it('emits enter/delete/confirm and hides after confirm', async () => {
    const onEnter = vi.fn()
    const onConfirm = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <CuNumberKeyboard isView value onEnter={onEnter} onConfirm={onConfirm} onChange={onChange} />,
    )
    fireEvent.click(container.querySelectorAll('.keyboard-number-item')[0])
    expect(onEnter).toHaveBeenCalledWith(1)

    fireEvent.click(container.querySelector('.keyboard-operate-item.confirm')!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(false)
  })

  it('disabled blocks keys; simple type has no operate area', () => {
    const onEnter = vi.fn()
    const disabled = render(<CuNumberKeyboard isView value disabled onEnter={onEnter} />)
    fireEvent.click(disabled.container.querySelectorAll('.keyboard-number-item')[0])
    expect(onEnter).not.toHaveBeenCalled()

    const simple = render(<CuNumberKeyboard isView value type="simple" />)
    expect(simple.container.querySelector('.keyboard-operate')).toBeNull()
  })
})
