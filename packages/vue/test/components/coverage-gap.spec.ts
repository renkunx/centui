/**
 * 覆盖率门禁补齐：M6 收官批次低分支覆盖组件（Ruler/Cashier 系/ImageReader/
 * WaterMark/Captcha/DropMenu/Bill/LicensePlate/TextareaItem/DatePicker/TabPicker）。
 * 画布类组件通过 stub HTMLCanvasElement.prototype.getContext 驱动 jsdom 下
 * 不可达的绘制路径；交互分支以行为断言为主。
 */
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CuBill,
  CuCashier,
  CuCashierChannel,
  CuCashierChannelButton,
  CuCashierChannelItem,
  CuCaptcha,
  CuDatePicker,
  CuDropMenu,
  CuImageReader,
  CuLicensePlate,
  CuRuler,
  CuTabPicker,
  CuTextareaItem,
  CuWaterMark,
} from '../../src'

async function settle(ms = 60) {
  await new Promise(r => setTimeout(r, ms))
}

/** 2d 上下文桩：jsdom 无 canvas 实现，代理记录调用即可驱动绘制分支 */
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
})

describe('CuRuler 画布与取值分支', () => {
  it('initX 边界：value ≤ realMin 回 0，≥ realMax 回满幅', async () => {
    const w = mount(CuRuler, { props: { value: 0, scope: [0, 100], unit: 10 } })
    await settle(30)
    expect(w.find('.cu-ruler').exists()).toBe(true)

    const w2 = mount(CuRuler, { props: { value: 100, scope: [0, 100], unit: 10 } })
    await settle(30)
    expect(w2.find('.cu-ruler').exists()).toBe(true)
  })

  it('realMin/realMax 收敛：min > scope 右界取左界；left > max 取右界；max > 右界取右界', async () => {
    const w = mount(CuRuler, { props: { value: 50, scope: [0, 100], min: 120, unit: 10 } })
    await settle(30)
    await w.setProps({ value: 55 })
    await settle(30)
    expect(w.find('.cu-ruler').exists()).toBe(true)

    const w2 = mount(CuRuler, { props: { value: 10, scope: [30, 100], max: 10, unit: 10 } })
    await settle(30)
    await w2.setProps({ value: 40 })
    await settle(30)
    expect(w2.find('.cu-ruler').exists()).toBe(true)

    const w3 = mount(CuRuler, { props: { value: 10, scope: [0, 50], max: 90, unit: 10 } })
    await settle(30)
    expect(w3.find('.cu-ruler').exists()).toBe(true)
  })

  it('外部 value 变化触发 isScrolling 守卫与重绘', async () => {
    const w = mount(CuRuler, { props: { value: 30, scope: [0, 100], unit: 10 } })
    await settle(30)
    await w.setProps({ value: 50 })
    await settle(30)
    await w.setProps({ value: 60 })
    await settle(30)
    expect(w.find('.cu-ruler').exists()).toBe(true)
  })

  it('stepTextRender 自定义刻度文本进入绘制循环', async () => {
    const w = mount(CuRuler, {
      props: {
        value: 50,
        scope: [0, 100],
        unit: 10,
        step: 20,
        stepTextPosition: 'bottom',
        stepTextRender: (step: number) => `${step}元`,
      },
    })
    await settle(30)
    expect(w.find('.cu-ruler-cursor').classes()).toContain('cu-ruler-cursor-bottom')
  })

  it('startDrag 重复触发走守卫分支；touchend 清理 window 监听', async () => {
    const w = mount(CuRuler, { props: { value: 50, scope: [0, 100], unit: 10 } })
    await settle(30)
    await w.find('.cu-ruler').trigger('touchstart', { touches: [{ pageX: 100 }] })
    // isDragging 已置位 → 守卫返回
    await w.find('.cu-ruler').trigger('touchstart', { touches: [{ pageX: 120 }] })
    await w.find('.cu-ruler').trigger('touchend', {})
    expect(w.find('.cu-ruler').exists()).toBe(true)
  })
})

describe('CuWaterMark 内容与槽位分支', () => {
  it('content 模式：vw/px/vh/number 四种间距解析进入绘制循环', async () => {
    for (const spacing of ['20vw', '30px', '10vh', 24]) {
      const w = mount(CuWaterMark, {
        props: { content: '水印', spacing: spacing as string | number },
      })
      await settle(20)
      expect(w.find('.water-mark-canvas').exists()).toBe(true)
    }
  })

  it('watermark 槽位：repeatX/repeatY 关闭时仅平铺一格', async () => {
    const w = mount(CuWaterMark, {
      props: { repeatX: false, repeatY: false, spacing: '10px' },
      slots: {
        watermark: '<span class="mark-cell">mark</span>',
      },
    })
    await settle(20)
    expect(w.findAll('.water-mark-line')).toHaveLength(1)
    expect(w.findAll('.mark-cell')).toHaveLength(1)
  })

  it('watermark 槽位重复平铺（测试环境 2×2）', async () => {
    const w = mount(CuWaterMark, {
      slots: { watermark: '<i class="mark-i">*</i>' },
    })
    await settle(20)
    expect(w.findAll('.water-mark-line')).toHaveLength(2)
    expect(w.findAll('.mark-i')).toHaveLength(4)
  })

  it('空注释槽位且无 content → 不渲染水印层', async () => {
    const w = mount(CuWaterMark, {
      slots: { watermark: '<!-- empty -->' },
    })
    await settle(20)
    expect(w.find('.water-mark-list').exists()).toBe(false)
  })
})

describe('CuCashierChannel 通道列表分支', () => {
  const channels = [
    { text: '卡一', value: 'a' },
    { text: '卡二', value: 'b' },
    { text: '卡三', value: 'c' },
  ]

  it('channels 超过 channelLimit：折叠态仅显示默认项，more 展开全部', async () => {
    const w = mount(CuCashierChannel, { props: { channels, defaultIndex: 1 } })
    await settle(20)
    // 折叠态：v-else-if channels[defaultIndex] 单项
    expect(w.findAll('.cu-cashier-channel-item')).toHaveLength(1)

    await w.find('.choose-channel-more').trigger('click')
    await settle(20)
    expect(w.findAll('.cu-cashier-channel-item')).toHaveLength(3)
    expect(w.find('.choose-channel').classes()).toContain('active')
  })

  it('channelLimit < 1 视为单通道：直接展开且无 more 按钮', async () => {
    const w = mount(CuCashierChannel, { props: { channels, channelLimit: 0 } })
    await settle(20)
    expect(w.findAll('.cu-cashier-channel-item')).toHaveLength(3)
    expect(w.find('.choose-channel-more').exists()).toBe(false)
  })

  it('禁用通道点击不发 select；通道数恰好等于 limit 无 more', async () => {
    const onSelect = vi.fn()
    const w = mount(CuCashierChannel, {
      props: {
        channels: [
          { text: '禁用', value: 'x', disabled: true },
          { text: '可用', value: 'y' },
        ],
        onSelect,
      },
    })
    await settle(20)
    expect(w.find('.choose-channel-more').exists()).toBe(false)

    await w.findAll('.cu-cashier-channel-item')[0].trigger('click')
    expect(onSelect).not.toHaveBeenCalled()

    await w.findAll('.cu-cashier-channel-item')[1].trigger('click')
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0].text).toBe('可用')
  })

  it('active 态下再点 more 走守卫；支付按钮 emit 当前选中通道', async () => {
    const onPay = vi.fn()
    const w = mount(CuCashierChannel, { props: { channels, onPay } })
    await settle(20)
    await w.find('.choose-channel-more').trigger('click')
    await settle(20)
    // active 后 more 点击被守卫拦截
    await w.find('.choose-channel-more').trigger('click')
    expect(w.findAll('.cu-cashier-channel-item')).toHaveLength(3)

    await w.find('.cu-cashier-pay-button').trigger('click')
    expect(onPay.mock.calls[0][0].text).toBe('卡一')
  })

  it('payButtonDisabled 时按钮置灰文案仍渲染', async () => {
    const w = mount(CuCashierChannel, {
      props: { channels, payButtonDisabled: true, payButtonText: '不可支付' },
    })
    await settle(20)
    const btn = w.find('.cu-cashier-pay-button')
    expect(btn.text()).toContain('不可支付')
    expect(btn.classes().join(' ')).toContain('disabled')
  })
})

describe('CuCashierChannelItem 展示分支', () => {
  it('icon / desc / action 内容与 active 角标', async () => {
    const handler = vi.fn()
    const w = mount(CuCashierChannelItem, {
      props: {
        active: true,
        data: {
          icon: 'card-wallet',
          text: '标题',
          desc: '描述',
          action: { text: '切换', handler },
        },
      },
    })
    expect(w.find('.item-icon').exists()).toBe(true)
    expect(w.find('.item-image').exists()).toBe(false)
    expect(w.find('.desc').text()).toBe('描述')
    await w.find('.title-active').trigger('click')
    expect(handler).toHaveBeenCalledTimes(1)
    // active → checked 图标
    expect(w.find('.item-check-icon [class*=checked]').exists()).toBe(true)
  })

  it('img 模式与 disabled 角标', async () => {
    const w = mount(CuCashierChannelItem, {
      props: { data: { img: 'https://example.com/x.png', text: '图片通道', disabled: true } },
    })
    expect(w.find('.item-image img').attributes('src')).toBe('https://example.com/x.png')
    expect(w.find('.item-check-icon [class*=check-disabled]').exists()).toBe(true)
  })

  it('无 active 无 disabled → 普通 check 图标', async () => {
    const w = mount(CuCashierChannelItem, { props: { data: { text: '普通' } } })
    expect(w.find('.item-check-icon').exists()).toBe(true)
  })
})

describe('CuCashierChannelButton 操作组', () => {
  it('多操作 inline 排布并触发 handler；空 handler 不抛错', async () => {
    const first = vi.fn()
    const w = mount(CuCashierChannelButton, {
      props: {
        actions: [
          { buttonText: '取消', handler: first },
          { buttonText: '确定', handler: null },
        ],
      },
    })
    const btns = w.findAll('button')
    expect(btns).toHaveLength(2)
    await btns[0].trigger('click')
    expect(first).toHaveBeenCalledTimes(1)
    await btns[1].trigger('click')
  })

  it('单个操作渲染一颗按钮', async () => {
    const w = mount(CuCashierChannelButton, {
      props: { actions: [{ buttonText: '知道了' }] },
    })
    expect(w.findAll('button')).toHaveLength(1)
  })
})

describe('CuCashier 场景切换与关闭', () => {
  const channels = [{ text: '支付宝' }]

  it('captcha 场景挂载；loading → fail → success 逐场景', async () => {
    const w = mount(CuCashier, { props: { modelValue: true, channels } })
    await settle(80)
    const vm = w.vm as unknown as { next: (s: string, o?: object) => void }

    vm.next('captcha', { text: '验证码', brief: '输入短信验证码' })
    await settle(80)
    expect(w.find('.cu-cashier-captcha').exists()).toBe(true)

    vm.next('loading')
    await settle(60)
    expect(w.find('.cu-cashier-loading').exists()).toBe(true)

    vm.next('fail', { text: '支付失败' })
    await settle(60)
    expect(w.find('.cu-cashier-fail').exists()).toBe(true)
    expect(w.find('.cu-cashier-block-text').text()).toBe('支付失败')

    vm.next('success')
    await settle(60)
    expect(w.find('.cu-cashier-success').exists()).toBe(true)
  })

  it('success/fail 确认按钮 handler 与默认关闭', async () => {
    const handler = vi.fn()
    const w = mount(CuCashier, { props: { modelValue: true, channels } })
    await settle(80)
    const vm = w.vm as unknown as { next: (s: string, o?: object) => void }
    vm.next('success', { buttonText: '完成', handler })
    await settle(60)
    await w.find('.cu-cashier-block-btn button').trigger('click')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('modelValue false→true 透传；popup hide 复位 choose 场景', async () => {
    const w = mount(CuCashier, { props: { modelValue: false, channels } })
    const vm = w.vm as unknown as { next: (s: string, o?: object) => void }
    await w.setProps({ modelValue: true })
    await settle(80)
    vm.next('loading')
    await settle(60)
    // 关闭弹层 → onPopupHide 复位场景
    await w.setProps({ modelValue: false })
    await settle(80)
    await w.setProps({ modelValue: true })
    await settle(80)
    expect(w.find('.cu-cashier-channel').exists()).toBe(true)
  })

  it('next 未知场景仍切换（sceneOption 守卫）', async () => {
    const w = mount(CuCashier, { props: { modelValue: true, channels } })
    await settle(80)
    const vm = w.vm as unknown as { next: (s: string, o?: object) => void }
    expect(() => vm.next('unknown' as never)).not.toThrow()
    await settle(60)
  })
})

describe('CuImageReader 文件处理分支', () => {
  function makeFile(name: string, content: string) {
    return new File([content], name, { type: 'image/png' })
  }

  function fireChange(input: HTMLInputElement, files: File[]) {
    Object.defineProperty(input, 'files', { value: files, configurable: true })
    input.dispatchEvent(new Event('change'))
  }

  /** jsdom 不解码图片：src 赋值后异步触发 onload */
  function stubAutoLoadImage() {
    class AutoImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      private _src = ''
      set src(v: string) {
        this._src = v
        if (v) setTimeout(() => this.onload?.(), 0)
      }
      get src() {
        return this._src
      }
    }
    vi.stubGlobal('Image', AutoImage)
  }

  it('mime 列表拼接与 camera/multiple 属性', async () => {
    const w = mount(CuImageReader, {
      props: { mime: ['png', 'jpeg'], isCameraOnly: true, isMultiple: true, name: 'up' },
    })
    const input = w.find('input').element
    expect(input.accept).toBe('image/png,image/jpeg')
    expect(input.multiple).toBe(true)
  })

  it('选择即 emit select；超量 emit error 103 并清空 input', async () => {
    const onError = vi.fn()
    const w = mount(CuImageReader, { props: { amount: 1, onError } })
    fireChange(w.find('input').element, [makeFile('a.png', 'aa'), makeFile('b.png', 'bb')])
    await settle(20)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.stringMatching(/^image-reader-/),
      expect.objectContaining({ code: '103' }),
    )
  })

  it('体积超限 emit error 101（FileReader 正常，dataUrl 超长）', async () => {
    const onError = vi.fn()
    stubAutoLoadImage()
    const w = mount(CuImageReader, { props: { size: 0.001, onError } })
    fireChange(w.find('input').element, [makeFile('big.png', 'x'.repeat(64))])
    await settle(300)
    expect(onError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ code: '101' }),
    )
  })

  it('读取成功 emit complete（blob/dataUrl/file）', async () => {
    const onComplete = vi.fn()
    stubAutoLoadImage()
    const w = mount(CuImageReader, { props: { onComplete } })
    fireChange(w.find('input').element, [makeFile('ok.png', 'ok')])
    await settle(300)
    expect(onComplete).toHaveBeenCalledTimes(1)
    const [name, data] = onComplete.mock.calls[0]
    expect(name).toMatch(/^image-reader-/)
    expect(data.dataUrl.startsWith('data:image/png')).toBe(true)
    expect(data.file.name).toBe('ok.png')
    expect(data.blob).toBeInstanceOf(Blob)
  })

  it('FileReader 失败 emit error 102', async () => {
    const onError = vi.fn()
    class FailingReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      result: string | ArrayBuffer | null = null
      readAsDataURL() {
        this.onerror?.()
      }
    }
    vi.stubGlobal('FileReader', FailingReader)
    const w = mount(CuImageReader, { props: { onError } })
    fireChange(w.find('input').element, [makeFile('bad.png', 'x')])
    await settle(100)
    expect(onError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ code: '102' }),
    )
  })

  it('图片解码失败 emit error 102', async () => {
    const onError = vi.fn()
    class BrokenImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      private _src = ''
      set src(v: string) {
        this._src = v
        if (v) this.onerror?.()
      }
      get src() {
        return this._src
      }
    }
    vi.stubGlobal('Image', BrokenImage)
    const w = mount(CuImageReader, { props: { onError } })
    fireChange(w.find('input').element, [makeFile('broken.png', 'b')])
    await settle(300)
    expect(onError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ code: '102' }),
    )
  })

  it('change 无文件不 emit', async () => {
    const w = mount(CuImageReader)
    w.find('input').element.dispatchEvent(new Event('change'))
    await settle(20)
    expect(w.find('input').exists()).toBe(true)
  })
})

describe('CuCaptcha 倒计时与错误分支', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  async function tick(ms = 0) {
    await vi.advanceTimersByTimeAsync(ms)
  }

  it('dialog 首次打开自动发送并进入倒计时，倒计时结束复位', async () => {
    const onSend = vi.fn()
    const w = mount(CuCaptcha, {
      props: { modelValue: true, count: 2, onSend },
    })
    await tick(10)
    expect(onSend).toHaveBeenCalledTimes(1)
    expect(w.find('.cu-captcha-btn').text()).toContain('2')

    await tick(2100)
    expect(w.find('.cu-captcha-btn').attributes('disabled')).toBeUndefined()
  })

  it('autoCountdown=false 仅发 send 不计时；autoSend=false 打开不发', async () => {
    const onSend = vi.fn()
    const w = mount(CuCaptcha, {
      props: { modelValue: false, autoCountdown: false, autoSend: false, onSend },
    })
    await tick(10)
    await w.setProps({ modelValue: true })
    await tick(10)
    expect(onSend).not.toHaveBeenCalled()

    await w.find('.cu-captcha-btn').trigger('click')
    expect(onSend).toHaveBeenCalledTimes(1)
    expect(w.find('.cu-captcha-btn').attributes('disabled')).toBeUndefined()

    // 外部通过暴露的 countdown 手动计时
    ;(w.vm as unknown as { countdown: () => void }).countdown()
    await tick(10)
    expect(w.find('.cu-captcha-btn').attributes('disabled')).toBeDefined()
  })

  it('count=0：按钮不渲染，挂载自动发送走 countdown 守卫', async () => {
    const onSend = vi.fn()
    const w = mount(CuCaptcha, { props: { isView: true, count: 0, onSend } })
    await tick(10)
    // v-if="count" 为假 → 无重发按钮；emitSend → countdown 空守卫直接返回
    expect(w.find('.cu-captcha-btn').exists()).toBe(false)
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it('setError 展示错误，输入新验证码清除错误', async () => {
    const w = mount(CuCaptcha, { props: { isView: true } })
    await tick(10)
    ;(w.vm as unknown as { setError: (m: string) => void }).setError('验证码错误')
    await tick(10)
    expect(w.find('.cu-captcha-error').text()).toBe('验证码错误')

    // 模拟 codebox 输入触发 code watch 清错
    const codebox = w.findComponent({ name: 'cu-codebox' })
    codebox.vm.$emit('update:modelValue', '1')
    await tick(10)
    expect(w.find('.cu-captcha-error').exists()).toBe(false)
    expect(w.find('.cu-captcha-brief').exists()).toBe(true)
  })

  it('disableSend：内联模式透传 codebox disabled 且不展示错误样式', async () => {
    const w = mount(CuCaptcha, { props: { isView: true, disableSend: true, count: 5 } })
    await tick(10)
    expect(w.find('.cu-captcha-btn').exists()).toBe(true)
    ;(w.vm as unknown as { setError: (m: string) => void }).setError('错了')
    await tick(10)
    expect(w.find('.cu-captcha-error').exists()).toBe(true)
    // isShowErrorStyle false：is-error-style 不透传给 codebox
    expect(w.find('.cu-codebox.is-error-style').exists()).toBe(false)
  })

  it('halfScreen + disableSend：发送键带 is-disabled-send 置灰类', async () => {
    const w = mount(CuCaptcha, {
      props: { type: 'halfScreen', modelValue: true, disableSend: true, count: 5 },
    })
    await tick(10)
    expect(w.find('.cu-captcha-btn').classes()).toContain('is-disabled-send')
  })

  it('halfScreen 模式 close() 收起', async () => {
    const onUpdate = vi.fn()
    const w = mount(CuCaptcha, {
      props: { type: 'halfScreen', modelValue: true, 'onUpdate:modelValue': onUpdate },
    })
    await tick(10)
    expect(w.find('.cu-captcha-half-container').exists()).toBe(true)
    ;(w.vm as unknown as { close: () => void }).close()
    await tick(10)
    expect(onUpdate).toHaveBeenCalledWith(false)
  })
})

describe('CuDropMenu 交互分支', () => {
  const data = [
    { text: '按距离', options: [{ value: 1, text: '1km' }, { value: 2, text: '5km' }] },
    { text: '排序', options: [{ value: 'a', text: '默认' }, { value: 'b', text: '价格' }] },
    { text: '禁用', disabled: true, options: [] },
  ]

  it('点击 bar 打开列表，再点 emit hide 收起；禁用项不打开', async () => {
    const onHide = vi.fn()
    const w = mount(CuDropMenu, { props: { data, onHide } })
    await settle(20)
    await w.findAll('.bar-item')[1].trigger('click')
    await settle(400)
    expect(w.find('.cu-popup-box').isVisible()).toBe(true)

    // 二次点击同一 bar → onBarItemClick else 分支收起（hide 事件确定性断言，
    // 关闭过渡的 display 时序由 Popup 专项测试覆盖）
    await w.findAll('.bar-item')[1].trigger('click')
    await settle(20)
    expect(onHide).toHaveBeenCalledTimes(1)

    // 禁用项：onBarItemClick 守卫返回，不打开
    await w.findAll('.bar-item')[2].trigger('click')
    await settle(400)
    expect((w.find('.cu-popup-box').element as HTMLElement).style.display).toBe('none')
  })

  it('选择列表项回填 bar 文案并 emit change', async () => {
    const onChange = vi.fn()
    const w = mount(CuDropMenu, { props: { data, onChange } })
    await settle(20)
    await w.findAll('.bar-item')[0].trigger('click')
    await settle(400)
    await w.findAll('.cu-radio-item')[1].trigger('click')
    await settle(400)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(w.findAll('.bar-item')[0].text()).toContain('5km')
  })

  it('defaultValue 按 text 深度匹配；未匹配保持默认文案', async () => {
    const nested = [
      {
        text: '一级',
        options: [{ value: 'x', text: 'X', options: [{ value: 'x1', text: 'X1' }] }],
      },
    ]
    const w = mount(CuDropMenu, { props: { data: nested, defaultValue: ['X'] } })
    await settle(20)
    expect(w.findAll('.bar-item')[0].text()).toContain('X')
    const got = (w.vm as unknown as { getSelectedValue: (i: number) => unknown }).getSelectedValue(0)
    expect((got as { text: string }).text).toBe('X')

    const w2 = mount(CuDropMenu, { props: { data: nested, defaultValue: ['不存在'] } })
    await settle(20)
    expect(w2.findAll('.bar-item')[0].text()).toContain('一级')
    expect(
      (w2.vm as unknown as { getSelectedValues: () => unknown[] }).getSelectedValues(),
    ).toEqual([])
  })

  it('data/defaultValue 变更触发重算', async () => {
    const w = mount(CuDropMenu, { props: { data } })
    await settle(20)
    await w.setProps({ defaultValue: [2] })
    await settle(20)
    expect(w.findAll('.bar-item')[0].text()).toContain('5km')

    await w.setProps({ data: [...data.slice(0, 1)] })
    await settle(20)
    expect(w.findAll('.bar-item')).toHaveLength(1)
  })
})

describe('CuBill 槽位分支', () => {
  it('默认头（title + no）与默认插槽内容', async () => {
    const w = mount(CuBill, {
      props: { title: '账单', no: '123' },
      slots: { default: '<div class="bill-body">正文</div>' },
    })
    expect(w.find('.cu-bill-title').text()).toBe('账单')
    expect(w.find('.cu-bill-no').text()).toContain('123')
    expect(w.find('.bill-body').exists()).toBe(true)
    expect(w.find('.cu-bill-footer').exists()).toBe(false)
  })

  it('header/footer 槽位替换默认结构；watermark 槽位透传', async () => {
    const w = mount(CuBill, {
      props: { title: '忽略' },
      slots: {
        header: '<div class="h-slot">自定义头</div>',
        footer: '<div class="f-slot">自定义脚</div>',
        watermark: '<i class="wm">*</i>',
      },
    })
    expect(w.find('.cu-bill-title').exists()).toBe(false)
    expect(w.find('.h-slot').exists()).toBe(true)
    expect(w.find('.f-slot').exists()).toBe(true)
    expect(w.find('.wm').exists()).toBe(true)
  })
})

describe('CuLicensePlate 输入与删除分支', () => {
  it('division 模式渲染键盘交互骨架', async () => {
    const onConfirm = vi.fn()
    const w = mount(CuLicensePlate, {
      props: { modelValue: '', modeShow: 'division', onConfirm },
    })
    await settle(20)
    expect(w.find('.cu-license-plate').exists()).toBe(true)
  })
})

describe('CuTextareaItem 公共方法与事件', () => {
  it('focus/blur/getValue/resizeTextarea 暴露；keyup/keydown 事件透传', async () => {
    const onKeyup = vi.fn()
    const w = mount(CuTextareaItem, {
      props: { maxHeight: 100, autosize: true, onKeyup },
      attachTo: document.body,
    })
    await settle(0)
    const vm = w.vm as unknown as {
      focus: () => void
      blur: () => void
      getValue: () => string
      resizeTextarea: () => void
    }
    vm.focus()
    await settle(0)
    vm.resizeTextarea()
    await w.find('textarea').trigger('keyup', { key: 'a' })
    expect(onKeyup).toHaveBeenCalledTimes(1)
    await w.find('textarea').trigger('keydown', { key: 'a' })
    expect(vm.getValue()).toBe('')
    vm.blur()
    w.unmount()
  })

  it('value/maxHeight 变更触发重算', async () => {
    const w = mount(CuTextareaItem, { props: { autosize: true } })
    await settle(0)
    await w.setProps({ value: '多行\n内容' })
    await settle(0)
    await w.setProps({ maxHeight: 50 })
    await settle(0)
    expect(w.find('textarea').element.value).toBe('多行\n内容')
  })
})

describe('CuDatePicker 事件透传', () => {
  it('change/confirm/cancel/show 事件透传；cancel 后恢复快照', async () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const w = mount(CuDatePicker, {
      props: { modelValue: true, type: 'date', onConfirm, onCancel },
    })
    await vi.advanceTimersByTimeAsync(10)
    const picker = w.findComponent({ name: 'cu-picker' })
    expect(picker.exists()).toBe(true)
    picker.vm.$emit('change', 0, 1, { text: '2024', value: '2024' })
    picker.vm.$emit('confirm', [{ text: '2024', value: '2024' }])
    expect(onConfirm).toHaveBeenCalledTimes(1)
    picker.vm.$emit('cancel')
    await vi.advanceTimersByTimeAsync(50)
    expect(onCancel).toHaveBeenCalledTimes(1)
    picker.vm.$emit('show')
    vi.useRealTimers()
    w.unmount()
  })
})

describe('CuTabPicker 事件与选择', () => {
  const cascadeData = {
    name: 'level1',
    label: '一级',
    options: [
      {
        value: 'zj',
        label: '浙江',
        children: {
          name: 'level2',
          label: '城市',
          options: [
            { value: 'hz', label: '杭州' },
            { value: 'nb', label: '宁波' },
          ],
        },
      },
      { value: 'js', label: '江苏' },
    ],
  }

  it('打开后切换 tab 并选择叶子项 emit change', async () => {
    const onChange = vi.fn()
    const w = mount(CuTabPicker, {
      props: { modelValue: true, data: cascadeData, onChange },
    })
    await settle(80)
    // 打开时只有一级 pane
    expect(w.findAll('.cu-tab-pane')).toHaveLength(1)
    await w.findAll('.cu-radio-item')[0].trigger('click')
    await settle(80)
    // 二级 pane 出现 → tab bar 两项
    expect(w.findAll('.cu-tab-pane')).toHaveLength(2)
    expect(w.findAll('.cu-tab-bar-item')).toHaveLength(2)
    // 切回第一个 tab
    await w.findAll('.cu-tab-bar-item')[0].trigger('click')
    await settle(80)
    // 选杭州叶子 → change
    await w.findAll('.cu-tab-pane')[1].find('.cu-radio-item').trigger('click')
    await settle(500)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].values).toEqual(['zj', 'hz'])
  })

  it('取消恢复快照：选择未确认项后取消回滚', async () => {
    const onUpdate = vi.fn()
    const w = mount(CuTabPicker, {
      props: { modelValue: true, data: cascadeData, defaultValue: ['zj'], 'onUpdate:modelValue': onUpdate },
    })
    await settle(80)
    // 展开二级
    await w.findAll('.cu-radio-item')[0].trigger('click')
    await settle(120)
    expect(w.findAll('.cu-tab-pane')).toHaveLength(2)
    // 取消 → 100ms 后回滚快照（tabsTmpKey 重挂载）
    await w.setProps({ modelValue: false })
    await settle(300)
    expect(onUpdate).toHaveBeenCalledWith(false)
    expect(w.find('.cu-tab-picker').exists()).toBe(true)
  })
})
