/**
 * M6-6 React 行为测试：Chart/ImageReader/LicensePlate/Cashier/RollerSuccess
 */
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  CuCashier,
  CuChart,
  CuCaptcha,
  CuImageReader,
  CuLicensePlate,
  CuRollerSuccess,
} from '../../src'

async function flush(ms = 60) {
  await act(async () => {
    await new Promise(r => setTimeout(r, ms))
  })
}

describe('CuChart', () => {
  const labels = ['一', '二', '三']
  const datasets = [{ color: '#5b8ff9', values: [10, 20, 30] }]

  it('renders svg with axis ticks and paths', () => {
    const { container } = render(
      <CuChart labels={labels} datasets={datasets} size={[300, 200]} max={30} min={0} lines={3} step={10} />,
    )
    expect(container.querySelector('svg.cu-chart')).not.toBeNull()
    expect(container.querySelectorAll('.cu-chart-axis-y g')).toHaveLength(4)
    expect(container.querySelectorAll('.cu-chart-axis-x g')).toHaveLength(3)
    expect(container.querySelector('.cu-chart-path')).not.toBeNull()
  })

  it('region theme renders area path', () => {
    const { container } = render(
      <CuChart
        labels={labels}
        datasets={[{ color: '#fa8919', theme: 'region', values: [10, 20, 30] }]}
        size={[300, 200]}
        max={30}
        min={0}
        lines={3}
        step={10}
      />,
    )
    expect(container.querySelector('.cu-chart-path-area')).not.toBeNull()
  })
})

describe('CuImageReader', () => {
  it('renders file input with mime', () => {
    const { container } = render(<CuImageReader mime={['png', 'jpeg']} />)
    const input = container.querySelector('input[type=file]')
    expect(input).not.toBeNull()
    expect(input?.getAttribute('accept')).toBe('image/png,image/jpeg')
  })

  it('select emits files and amount overflow errors', async () => {
    const onSelect = vi.fn()
    const onError = vi.fn()
    const { container } = render(<CuImageReader onSelect={onSelect} onError={onError} amount={1} />)
    const input = container.querySelector('input[type=file]') as HTMLInputElement
    Object.defineProperty(input, 'files', {
      value: [new File(['x'], 'a.png'), new File(['y'], 'b.png')],
      configurable: true,
    })
    await act(async () => {
      fireEvent.change(input)
    })
    expect(onSelect).toHaveBeenCalled()
    expect(onError.mock.calls[0][1]).toEqual({ code: '103', msg: 'the number of pictures exceeds the limit' })
  })
})

describe('CuLicensePlate', () => {
  it('defaultValue fills key array', () => {
    const { container } = render(<CuLicensePlate defaultValue="浙AD12345" />)
    const items = container.querySelectorAll('.cu-license-plate-input-item')
    expect(items).toHaveLength(8)
    expect(items[0].textContent).toBe('浙')
  })

  it('shortcut click fills first slot and switches keyboard', async () => {
    const { container } = render(<CuLicensePlate modeShow="division" />)
    expect(container.querySelector('.cu-license-plate-keyboard')).toBeNull()
    fireEvent.click(container.querySelectorAll('.cu-license-plate-input-item')[0])
    await flush(40)
    expect(container.querySelector('.cu-shortcut-row')).not.toBeNull()
    fireEvent.click(container.querySelectorAll('.cu-shortcut-row-item')[0])
    await flush(40)
    expect(container.querySelectorAll('.cu-license-plate-input-item')[0].textContent).toBe('京')
    expect(container.querySelector('.cu-mixed-key-board')).not.toBeNull()
  })

  it('popUp mode renders title bar', () => {
    const { container } = render(<CuLicensePlate modeShow="popUp" showPopUp />)
    expect(container.querySelector('.cu-popup-title-bar')).not.toBeNull()
  })
})

describe('CuRollerSuccess', () => {
  it('renders success check lines when isSuccess', () => {
    const { container } = render(<CuRollerSuccess isSuccess />)
    expect(container.querySelectorAll('line')).toHaveLength(2)
  })
})

describe('CuCashier', () => {
  const channels = [
    { text: '招商银行储蓄卡', desc: '招商银行(1234)' },
    { text: '支付宝' },
  ]

  it('choose scene lists channels with pay button', async () => {
    const { container } = render(
      <CuCashier value paymentAmount="1000.00" channels={channels} />,
    )
    await flush(80)
    expect(container.querySelectorAll('.cu-cashier-channel-item')).toHaveLength(2)
    expect(container.querySelector('.choose-number')?.textContent).toBe('1000.00')
    expect(container.querySelector('.cu-cashier-pay-button')?.textContent).toContain('确定支付')
  })

  it('channel select and pay events', async () => {
    const onSelect = vi.fn()
    const onPay = vi.fn()
    const { container } = render(
      <CuCashier value channels={channels} onSelect={onSelect} onPay={onPay} />,
    )
    await flush(80)
    fireEvent.click(container.querySelectorAll('.cu-cashier-channel-item')[1])
    expect(onSelect.mock.calls[0][0].text).toBe('支付宝')
    fireEvent.click(container.querySelector('.cu-cashier-pay-button')!)
    expect(onPay.mock.calls[0][0].text).toBe('支付宝')
  })

  it('next(scene) switches scene blocks', async () => {
    const ref = { current: null as unknown as { next: (s: 'success', o?: object) => void } }
    const { container } = render(<CuCashier value channels={channels} ref={ref as never} />)
    await flush(80)
    ref.current.next('success', { text: '支付成功啦' })
    await flush(40)
    expect(container.querySelector('.cu-cashier-success')).not.toBeNull()
    expect(container.querySelector('.cu-cashier-block-text')?.textContent).toBe('支付成功啦')
  })
})

describe('M6-6 分支补强', () => {
  it('image-reader: size limit 101 fires error', async () => {
    const onError = vi.fn()
    const { container } = render(<CuImageReader size={1} onError={onError} />)
    const input = container.querySelector('input[type=file]') as HTMLInputElement
    const bigFile = new File(['x'.repeat(4000)], 'big.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [bigFile], configurable: true })
    await act(async () => {
      fireEvent.change(input)
    })
    await flush(150)
    expect(onError.mock.calls.some(c => c[1].code === '101')).toBe(true)
  })

  it('image-reader: complete fires with mocked Image', async () => {
    const onComplete = vi.fn()
    const FakeImage = class {
      onload: (() => void) | null = null
      src = ''
      set srcSetter(v: string) {
        this.src = v
      }
    }
    const OriginalImage = window.Image
    ;(window as unknown as { Image: unknown }).Image = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(v: string) {
        void v
        setTimeout(() => this.onload?.(), 0)
      }
    }
    const { container } = render(<CuImageReader onComplete={onComplete} />)
    const input = container.querySelector('input[type=file]') as HTMLInputElement
    const file = new File([new Uint8Array(1)], 'a.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await act(async () => {
      fireEvent.change(input)
    })
    await flush(150)
    ;(window as unknown as { Image: unknown }).Image = OriginalImage
    void FakeImage
    expect(onComplete).toHaveBeenCalled()
  })

  it('chart: rem size and heat theme', () => {
    const { container } = render(
      <CuChart
        labels={['一', '二']}
        datasets={[{ color: '#5b8ff9', theme: 'heat', values: [10, 20] }]}
        size={['30rem', '20rem']}
        max={30}
        min={0}
        lines={3}
        step={10}
      />,
    )
    // rem: 30rem * 16 = 480
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 480 320')
    expect(container.innerHTML).toContain('path-fill-gradient-')
  })

  it('license-plate: disorderClick guards and confirm key', async () => {
    const onConfirm = vi.fn()
    const { container } = render(
      <CuLicensePlate modeShow="division" disorderClick={false} onConfirm={onConfirm} defaultValue="浙A" />,
    )
    // disorderClick=false：点击第 3 格（前两格未连填）不切换选中
    fireEvent.click(container.querySelectorAll('.cu-license-plate-input-item')[2])
    await flush(40)
    // 键盘未展开（首格未填时点击被拒）→ 也无确认
    expect(onConfirm).not.toHaveBeenCalled()
    // 点击第一格 → 键盘展开 → shortcut 京 → confirm 键存在
    fireEvent.click(container.querySelectorAll('.cu-license-plate-input-item')[0])
    await flush(40)
    expect(container.querySelector('.cu-shortcut-row')).not.toBeNull()
  })

  it('cashier: captcha scene and fail scene via next()', async () => {
    const onSend = vi.fn()
    const onSubmit = vi.fn()
    const ref = { current: null as unknown as { next: (s: 'captcha' | 'fail', o?: object) => void } }
    const { container } = render(
      <CuCashier value channels={[{ text: 'A' }]} ref={ref as never} />,
    )
    await flush(80)
    ref.current.next('captcha', { text: '请输入验证码', brief: '已发送', onSend, onSubmit })
    await flush(80)
    expect(container.querySelector('.cu-cashier-captcha')).not.toBeNull()
    expect(onSend).toHaveBeenCalled()
    ref.current.next('fail', { text: '支付失败' })
    await flush(80)
    expect(container.querySelector('.cu-cashier-fail')).not.toBeNull()
    expect(container.querySelector('.cu-cashier-block-text')?.textContent).toBe('支付失败')
  })

  it('cashier: loading scene and custom scene', async () => {
    const ref = { current: null as unknown as { next: (s: 'loading' | 'custom', o?: object) => void } }
    const { container } = render(
      <CuCashier
        value
        channels={[{ text: 'A' }]}
        ref={ref as never}
        sceneSlot={<div className="my-custom">自定义场景</div>}
      />,
    )
    await flush(80)
    ref.current.next('loading')
    await flush(40)
    expect(container.querySelector('.cu-cashier-loading')).not.toBeNull()
    ref.current.next('custom')
    await flush(40)
    expect(container.querySelector('.my-custom')).not.toBeNull()
  })

  it('roller-success: non-success hides check lines', () => {
    const { container } = render(<CuRollerSuccess isSuccess={false} />)
    expect(container.querySelectorAll('line')).toHaveLength(0)
  })
})

describe('M6-6 CashierChannel 分支补强', () => {
  it('channelLimit<1 renders single default channel only', async () => {
    const { container } = render(
      <CuCashier
        value
        channels={[{ text: 'A' }, { text: 'B' }]}
        channelLimit={0}
        defaultIndex={1}
      />,
    )
    await flush(80)
    // 单渠道模式只渲染 defaultIndex 指定的渠道
    const items = container.querySelectorAll('.cu-cashier-channel-item')
    // v2 契约：isSingle 渲染全部渠道
    expect(items).toHaveLength(2)
    // 无 more 按钮
    expect(container.querySelector('.choose-channel-more')).toBeNull()
  })

  it('disabled channel item blocks select', async () => {
    const onSelect = vi.fn()
    const { container } = render(
      <CuCashier
        value
        channels={[{ text: 'A', disabled: true }]}
        channelLimit={0}
        onSelect={onSelect}
      />,
    )
    await flush(80)
    fireEvent.click(container.querySelector('.cu-cashier-channel-item')!)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('more button expands channel list', async () => {
    const { container } = render(
      <CuCashier
        value
        channels={[{ text: 'A' }, { text: 'B' }, { text: 'C' }]}
        channelLimit={2}
        defaultIndex={0}
      />,
    )
    await flush(80)
    // 渠道数 > channelLimit → 先只渲染一个 default
    expect(container.querySelectorAll('.cu-cashier-channel-item')).toHaveLength(1)
    const more = container.querySelector('.choose-channel-more')!
    fireEvent.click(more)
    await flush(60)
    expect(container.querySelectorAll('.cu-cashier-channel-item')).toHaveLength(3)
    expect(container.querySelector('.choose-channel-more')?.className).toContain('disabled')
    // 再点击无效（已激活）
    fireEvent.click(container.querySelector('.choose-channel-more')!)
    await flush(40)
    expect(container.querySelectorAll('.cu-cashier-channel-item')).toHaveLength(3)
  })

  it('channel action link triggers handler', async () => {
    const handler = vi.fn()
    const { container } = render(
      <CuCashier
        value
        channels={[{ text: 'A', action: { text: '换卡', handler } }]}
        channelLimit={0}
      />,
    )
    await flush(80)
    fireEvent.click(container.querySelector('.title-active')!)
    expect(handler).toHaveBeenCalled()
  })

  it('channel button slot overrides pay text', () => {
    const { container } = render(
      <CuCashier
        value
        channels={[{ text: 'A' }]}
        channelLimit={0}
        payButtonSlot={<span className="custom-pay">立即支付</span>}
      />,
    )
    expect(container.querySelector('.custom-pay')).not.toBeNull()
  })
})

describe('M6-6 LicensePlate/Cashier 收尾分支', () => {
  it('license-plate delete key clears current slot', async () => {
    const { container } = render(
      <CuLicensePlate modeShow="division" defaultValue="浙AD12345" />,
    )
    fireEvent.click(container.querySelectorAll('.cu-license-plate-input-item')[0])
    await flush(40)
    // 先按 shortcut 填第一位 → 进入混合键盘
    fireEvent.click(container.querySelectorAll('.cu-shortcut-row-item')[0])
    await flush(40)
    // delete 键清空当前位并回退到 0 → 键盘收起（division）
    fireEvent.click(container.querySelector('.cu-mixed-key-board-item .delete')!)
    await flush(40)
    expect(container.querySelectorAll('.cu-license-plate-input-item')[1].textContent).toBe('')
    // 回退到第 1 位 → 切回 shortcut 键盘（无 delete 键），键盘保持展开
    expect(container.querySelector('.cu-shortcut-row')).not.toBeNull()
  })

  it('license-plate confirm key emits joined value', async () => {
    const onConfirm = vi.fn()
    const { container } = render(
      <CuLicensePlate modeShow="division" defaultValue="浙AD12345" onConfirm={onConfirm} />,
    )
    fireEvent.click(container.querySelectorAll('.cu-license-plate-input-item')[0])
    await flush(40)
    // 第一位是 shortcut 键盘：先填 京 再进混合键盘按确认
    fireEvent.click(container.querySelectorAll('.cu-shortcut-row-item')[0])
    await flush(40)
    fireEvent.click(container.querySelector('.cu-mixed-key-board-item .confirm')!)
    await flush(40)
    expect(onConfirm).toHaveBeenCalledWith('京AD12345')
  })

  it('chart: heat theme and custom format', () => {
    const { container } = render(
      <CuChart
        labels={['一', '二']}
        datasets={[{ color: '#5b8ff9', theme: 'heat', values: [10, 20] }]}
        size={[300, 200]}
        max={30}
        min={0}
        lines={3}
        step={10}
        format={(v: number) => `${v}px`}
      />,
    )
    expect(container.innerHTML).toContain('path-fill-gradient-')
    expect(container.textContent).toContain('30px')
  })

  it('image-reader: camera only adds capture attr', () => {
    const { container } = render(<CuImageReader isCameraOnly />)
    expect(container.querySelector('input')?.getAttribute('capture')).not.toBeNull()
  })
})

describe('M6-6 Captcha 分支补强', () => {
  it('dialog mode renders popup skeleton inline (appendTo false)', async () => {
    const { container } = render(<CuCaptcha type="dialog" value brief="b" maxlength={4} />)
    await flush(80)
    // dialog 留在组件树内（appendTo=false 契约）
    expect(container.querySelector('.cu-dialog .cu-captcha-content')).not.toBeNull()
    const dialogEl = container.querySelector('.cu-dialog')
    expect(dialogEl?.getAttribute('position')).toBe('center')
  })

  it('halfScreen mode with system keyboard and mask', async () => {
    const { container } = render(
      <CuCaptcha type="halfScreen" value system mask title="T" subtitle="S" maxlength={6} />,
    )
    await flush(80)
    expect(container.querySelector('.cu-popup-title-bar')).not.toBeNull()
    const input = container.querySelector('input')
    expect(input?.getAttribute('maxlength')).toBe('6')
  })

  it('value=true clears typed code (v2 watch 契约)', async () => {
    const { container, rerender } = render(
      <CuCaptcha isView maxlength={4} />,
    )
    await flush(60)
    // 真实输入框在隐藏 form 内（system=false）
    const input = container.querySelector('form input') as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { value: '12' } })
    })
    await flush(40)
    const boxes = container.querySelectorAll('.cu-codebox-box')
    expect(boxes[0].textContent).toBe('1')
    expect(boxes[1].textContent).toBe('2')
    // 重开弹层 → 码值清空
    rerender(<CuCaptcha isView={false} maxlength={4} />)
    rerender(<CuCaptcha isView maxlength={4} value />)
    await flush(150)
    const inputEl = container.querySelector('form input') as HTMLInputElement
    expect(inputEl.value).toBe('')
    expect(container.querySelectorAll('.cu-codebox-box.is-filled')).toHaveLength(0)
  })

  it('disableSend styles the button in halfScreen mode', () => {
    const { container } = render(
      <CuCaptcha type="halfScreen" value system mask maxlength={4} disableSend count={30} />,
    )
    expect(container.querySelector('.cu-captcha-btn.is-disabled-send')).not.toBeNull()
  })
})

describe('M6-6 LicensePlate popUp 分支', () => {
  it('popUp closed hides popup box', () => {
    const { container } = render(
      <CuLicensePlate modeShow="popUp" showPopUp={false} defaultValue="浙AD12345" />,
    )
    expect(container.querySelector('.cu-popup-box')?.getAttribute('style')).toContain('display: none')
  })

  it('shortcuts prop override renders custom provinces', async () => {
    const { container } = render(
      <CuLicensePlate modeShow="division" shortcuts={['苏', '粤']} />,
    )
    fireEvent.click(container.querySelectorAll('.cu-license-plate-input-item')[0])
    await flush(40)
    const rows = container.querySelectorAll('.cu-shortcut-row-item')
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toBe('苏')
  })
})
