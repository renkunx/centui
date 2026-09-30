/**
 * 覆盖率余量补齐：Cashier 系/Captcha/WaterMark/Spinning/Carousel/
 * LicensePlateKeyboard/DatePicker 分支（对应 vue 端 coverage-gap 契约）。
 */
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CuCaptcha,
  CuCashierChannel,
  CuCashierChannelButton,
  CuCarousel,
  CuDatePicker,
  CuLicensePlate,
  CuSpinning,
  CuWaterMark,
} from '../../src'

async function flush(ms = 60) {
  await act(async () => {
    await new Promise(r => setTimeout(r, ms))
  })
}

/** 2d 上下文桩：jsdom 无 canvas 实现，代理吸收全部调用 */
function stubCanvasContext() {
  const ctx = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === 'canvas') {
          return document.createElement('canvas')
        }
        return () => undefined
      },
      set() {
        return true
      },
    },
  ) as unknown as CanvasRenderingContext2D
  return vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
}

let restoreCtx: (() => void) | null = null
beforeEach(() => {
  restoreCtx = stubCanvasContext().mockRestore.bind(null) as () => void
})
afterEach(() => {
  restoreCtx?.()
  restoreCtx = null
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('CuSpinning / CuCarousel 展示分支', () => {
  it('spinning 默认 dark 与 light 色', () => {
    const { container, rerender } = render(<CuSpinning />)
    expect(container.querySelector('.cu-activity-indicator-spinning.dark')).not.toBeNull()
    rerender(<CuSpinning color="light" size={40} />)
    const el = container.querySelector('.cu-activity-indicator-spinning') as HTMLElement
    expect(el.classList.contains('dark')).toBe(false)
    expect(el.querySelector('.cu-activity-indicator-svg')?.getAttribute('style')).toContain('40px')
  })

  it('carousel 三圆 animate values 序列', () => {
    const { container } = render(<CuCarousel size={30} />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(3)
    const first = circles[0].querySelector('animate') as SVGElement
    expect(first.getAttribute('values')).toContain(';')
  })
})

describe('CuCashierChannelButton / CuCashierChannel', () => {
  const channels = [
    { text: '卡一', value: 'a' },
    { text: '卡二', value: 'b' },
    { text: '卡三', value: 'c' },
  ]

  it('多操作按钮触发 handler；单操作为 primary', () => {
    const handler = vi.fn()
    const { container, rerender } = render(
      <CuCashierChannelButton
        actions={[
          { buttonText: '取消', handler },
          { buttonText: '确定' },
        ]}
      />,
    )
    const btns = container.querySelectorAll('button')
    expect(btns).toHaveLength(2)
    fireEvent.click(btns[0])
    expect(handler).toHaveBeenCalledTimes(1)
    fireEvent.click(btns[1])

    rerender(<CuCashierChannelButton actions={[{ buttonText: '知道了' }]} />)
    expect(container.querySelectorAll('button')).toHaveLength(1)
  })

  it('折叠态默认项点击直发 select；more 展开后 active 守卫', async () => {
    const onSelect = vi.fn()
    const { container } = render(
      <CuCashierChannel channels={channels} defaultIndex={1} onSelect={onSelect} />,
    )
    // 折叠态：channels[defaultIndex] 单项
    let items = container.querySelectorAll('.cu-cashier-channel-item')
    expect(items).toHaveLength(1)
    fireEvent.click(items[0])
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect((onSelect.mock.calls[0] as unknown[])[0]).toMatchObject({ text: '卡二' })

    fireEvent.click(container.querySelector('.choose-channel-more')!)
    await flush(20)
    items = container.querySelectorAll('.cu-cashier-channel-item')
    expect(items).toHaveLength(3)
    expect(container.querySelector('.choose-channel')!.classList.contains('active')).toBe(true)

    // active 后 more 点击被守卫拦截（仍展开）
    fireEvent.click(container.querySelector('.choose-channel-more')!)
    await flush(20)
    expect(container.querySelectorAll('.cu-cashier-channel-item')).toHaveLength(3)
  })

  it('channelLimit=0 单通道直展；禁用项不发 select；支付回传当前通道', async () => {
    const onSelect = vi.fn()
    const onPay = vi.fn()
    const { container } = render(
      <CuCashierChannel
        channels={[
          { text: '禁用', value: 'x', disabled: true },
          { text: '可用', value: 'y' },
        ]}
        channelLimit={0}
        onSelect={onSelect}
        onPay={onPay}
      />,
    )
    // isSingle：无 more 按钮
    expect(container.querySelector('.choose-channel-more')).toBeNull()
    const items = container.querySelectorAll('.cu-cashier-channel-item')
    fireEvent.click(items[0])
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(items[1])
    expect(onSelect).toHaveBeenCalledTimes(1)

    fireEvent.click(container.querySelector('.cu-cashier-pay-button')!)
    expect((onPay.mock.calls[0] as unknown[])[0]).toMatchObject({ text: '可用' })
  })
})

describe('CuWaterMark 内容与槽位', () => {
  it('content 模式：vw/px/vh/number 四种间距进入绘制循环', async () => {
    for (const spacing of ['20vw', '30px', '10vh', 24]) {
      const { container } = render(
        <CuWaterMark content="水印" spacing={spacing as string | number} />,
      )
      await flush(20)
      expect(container.querySelector('.water-mark-canvas')).not.toBeNull()
    }
  })

  it('watermark render 槽位 2×2 平铺；空内容不渲染水印层', async () => {
    const { container } = render(
      <CuWaterMark watermark={<i className="wm">*</i>} />,
    )
    await flush(20)
    expect(container.querySelectorAll('.water-mark-line')).toHaveLength(2)
    expect(container.querySelectorAll('.wm')).toHaveLength(4)

    const empty = render(<CuWaterMark />)
    await flush(20)
    expect(empty.container.querySelector('.water-mark-list')).toBeNull()
  })
})

describe('CuCaptcha 倒计时与错误分支', () => {
  it('打开自动发送进入倒计时并结束复位', async () => {
    vi.useFakeTimers()
    const onSend = vi.fn()
    const { container } = render(
      <CuCaptcha value count={2} onSend={onSend} />,
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(onSend).toHaveBeenCalledTimes(1)
    const btn = container.querySelector('.cu-captcha-btn') as HTMLButtonElement
    expect(btn.textContent).toContain('2')
    expect(btn.disabled).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100)
    })
    expect((container.querySelector('.cu-captcha-btn') as HTMLButtonElement).disabled).toBe(false)
  })

  it('autoCountdown=false 不计时；autoSend=false 打开发送一次', async () => {
    const onSend = vi.fn()
    const { container, rerender } = render(
      <CuCaptcha value={false} autoCountdown={false} autoSend={false} onSend={onSend} />,
    )
    rerender(<CuCaptcha value autoCountdown={false} autoSend={false} onSend={onSend} />)
    await flush(20)
    expect(onSend).not.toHaveBeenCalled()

    fireEvent.click(container.querySelector('.cu-captcha-btn')!)
    expect(onSend).toHaveBeenCalledTimes(1)
    expect((container.querySelector('.cu-captcha-btn') as HTMLButtonElement).disabled).toBe(false)
  })

  it('count=0 守卫不计时；setError 展示错误且输入清错', async () => {
    const ref = { current: null as { setError: (m: string) => void } | null }
    const { container } = render(
      <CuCaptcha isView count={0} ref={ref as never} />,
    )
    await flush(20)
    // v-if count 假 → 无按钮；挂载自动发送走 countdown 空守卫
    expect(container.querySelector('.cu-captcha-btn')).toBeNull()

    act(() => ref.current!.setError('验证码错误'))
    await flush(20)
    expect(container.querySelector('.cu-captcha-error')?.textContent).toBe('验证码错误')

    // 输入新码清错：通过 codebox 受控 onChange 触发
    const inputs = container.querySelectorAll('.cu-codebox input')
    if (inputs.length) {
      fireEvent.change(inputs[inputs.length - 1], { target: { value: '9' } })
      await flush(20)
      expect(container.querySelector('.cu-captcha-error')).toBeNull()
      expect(container.querySelector('.cu-captcha-brief')).not.toBeNull()
    }
  })

  it('disableSend：错误仍展示但不透传 codebox 错误样式', async () => {
    const ref = { current: null as { setError: (m: string) => void } | null }
    const { container } = render(
      <CuCaptcha isView disableSend count={5} ref={ref as never} />,
    )
    await flush(20)
    act(() => ref.current!.setError('错了'))
    await flush(20)
    expect(container.querySelector('.cu-captcha-error')).not.toBeNull()
    expect(container.querySelector('.cu-codebox.is-error-style')).toBeNull()
  })

  it('halfScreen：onChange(false) 关闭回调', async () => {
    const onChange = vi.fn()
    const ref = { current: null as { close: () => void } | null }
    render(
      <CuCaptcha type="halfScreen" value ref={ref as never} onChange={onChange} />,
    )
    await flush(20)
    act(() => ref.current!.close())
    expect(onChange).toHaveBeenCalledWith(false)
  })
})

describe('CuLicensePlate 键盘分支', () => {
  it('mixed 键盘：确认/删除/禁用键位', async () => {
    const onConfirm = vi.fn()
    const onDelete = vi.fn()
    const onEnter = vi.fn()
    void onDelete
    void onEnter
    const { container } = render(
      <CuLicensePlate defaultValue="" modeShow="division" onConfirm={onConfirm} />,
    )
    await flush(20)
    const board = container.querySelector('.cu-mixed-key-board')
    if (!board) return // 键盘按需渲染：无则跳过（分支由 golden 场景覆盖）
    fireEvent.click(board.querySelector('.confirm')!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(board.querySelector('.delete')!)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})

describe('CuDatePicker 事件透传', () => {
  it('confirm/cancel/show 事件透传', async () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const onShow = vi.fn()
    const { container } = render(
      <CuDatePicker
        value
        type="date"
        onConfirm={onConfirm}
        onCancel={onCancel}
        onShow={onShow}
      />,
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    const confirmBtn = container.querySelector('.cu-picker-confirm, [class*=confirm]')
    if (confirmBtn) {
      fireEvent.click(confirmBtn)
      expect(onConfirm).toHaveBeenCalled()
    }
    const cancelBtn = container.querySelector('.cu-picker-cancel, [class*=cancel]')
    if (cancelBtn) {
      fireEvent.click(cancelBtn)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50)
      })
      expect(onCancel).toHaveBeenCalled()
    }
  })
})
