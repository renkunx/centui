/**
 * captcha 倒计时状态机测试（对照 Vue 版 Captcha.vue countdown/resetcount）。
 */
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {computeCountdown, formatCountdown, CAPTCHA_TEXT} from '../../src/components/captcha/logic'

describe('captcha/logic', () => {
  it('formatCountdown：{$1} 占位替换（Vue countActiveText.replace）', () => {
    expect(formatCountdown('{$1}s 后重发', 58)).toBe('58s 后重发')
    expect(formatCountdown('resend in {$1}s', 3)).toBe('resend in 3s')
  })

  it('computeCountdown：i = count - floor(elapsed/1000)，时间戳基准不漂移', () => {
    const start = 1_000_000
    // 未流逝
    expect(computeCountdown(60, start, start)).toEqual({
      index: 60,
      text: '60s 后重发',
      finished: false,
    })
    // 2.4s 后 → 58（floor，对齐 Vue Math.floor）
    expect(computeCountdown(60, start, start + 2400).index).toBe(58)
    // 59s 后 → 1
    expect(computeCountdown(60, start, start + 59_000).index).toBe(1)
  })

  it('computeCountdown：i<=1 归位（finished，resetcount 由调用方触发）', () => {
    const start = 1_000_000
    expect(computeCountdown(60, start, start + 59_100).finished).toBe(true)
    expect(computeCountdown(60, start, start + 61_000).finished).toBe(true)
    expect(computeCountdown(1, start, start + 0).finished).toBe(true)
  })

  it('computeCountdown：自定义 countActiveText 模板', () => {
    const result = computeCountdown(10, 0, 3000, '{$1}秒后可重发')
    expect(result.text).toBe('7秒后可重发')
  })

  it('locale 默认值（对齐 @centui/core lang/zh-CN md.captcha）', () => {
    expect(CAPTCHA_TEXT.sendCaptcha).toBe('发送验证码')
    expect(CAPTCHA_TEXT.countdown).toBe('{$1}s 后重发')
  })
})

describe('captcha 倒计时登记表（shared/timer 集成路径）', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('detached 清理路径的定时器语义：interval 持续 tick、clear 终止', async () => {
    // 组件内 countdown 通过 createTimerRegistry 登记 interval；此处验证等价定时器行为
    const {createTimerRegistry} = await import('../../src/shared/timer')
    const reg = createTimerRegistry({})
    const tick = vi.fn()
    const id = reg.setInterval(tick, 1000)
    vi.advanceTimersByTime(3500)
    expect(tick).toHaveBeenCalledTimes(3)
    reg.clearInterval(id)
    vi.advanceTimersByTime(5000)
    expect(tick).toHaveBeenCalledTimes(3)
    reg.clearAll()
  })
})

/**
 * 组件层（index.ts）：attached 首发链路、show 观察者、错误态/内联态 observers、
 * popup 转发、倒计时状态机（fake timers）、键盘高度监听与 detached 清理。
 */
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/captcha/index'))

describe('captcha 组件', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const g = globalThis as any
    g.wx.onKeyboardHeightChange = vi.fn()
    g.wx.offKeyboardHeightChange = vi.fn()
  })
  afterEach(() => vi.useRealTimers())

  it('attached（dialog 未显示）：内态派生，不首发、无键盘监听', () => {
    const inst = mountDef(comp.def, {props: {countNormalText: '获取验证码'}})
    inst.attached()
    expect(inst.data.innerShow).toBe(false)
    expect(inst.data.isInline).toBe(false)
    expect(inst.data.countBtnText).toBe('获取验证码')
    expect(inst.events).toEqual([])
    expect((globalThis as any).wx.onKeyboardHeightChange).not.toHaveBeenCalled()
  })

  it('attached（show=true）：首发 send + 倒计时启动', () => {
    const inst = mountDef(comp.def, {props: {show: true}})
    inst.attached()
    expect(inst.data.innerShow).toBe(true)
    expect(inst.eventsOf('send')).toHaveLength(1)
    expect(inst.data.isCounting).toBe(true)
    expect(inst.data.countBtnText).toBe('60s 后重发')
    expect((inst as any).__captchaState.firstShown).toBe(true)
    expect((inst as any).__captchaState.timers.size()).toBe(1)
  })

  it('attached（type=inline）：内联模式首发', () => {
    const inst = mountDef(comp.def, {props: {type: 'inline'}})
    inst.attached()
    expect(inst.data.isInline).toBe(true)
    expect(inst.eventsOf('send')).toHaveLength(1)
  })

  it('attached（autoSend=false）：不首发', () => {
    const inst = mountDef(comp.def, {props: {show: true, autoSend: false}})
    inst.attached()
    expect(inst.events).toEqual([])
    expect(inst.data.isCounting).toBe(false)
  })

  it('halfScreen：注册键盘高度监听，detached 注销 + 定时器清理', () => {
    const inst = mountDef(comp.def, {props: {type: 'halfScreen'}})
    inst.attached()
    const register = (globalThis as any).wx.onKeyboardHeightChange as ReturnType<typeof vi.fn>
    expect(register).toHaveBeenCalledTimes(1)
    const handler = register.mock.calls[0][0]
    handler({height: 200})
    expect(inst.data.isKeyboard).toBe(true)
    handler({height: 0})
    expect(inst.data.isKeyboard).toBe(false)

    inst.detached()
    expect((globalThis as any).wx.offKeyboardHeightChange).toHaveBeenCalledWith(handler)
    expect((inst as any).__captchaState.kbHandler).toBeNull()
  })

  it('detached（非 halfScreen）：不注销键盘监听，定时器清理', () => {
    const inst = mountDef(comp.def, {props: {show: true}})
    inst.attached()
    expect((inst as any).__captchaState.timers.size()).toBe(1)
    inst.detached()
    expect((globalThis as any).wx.offKeyboardHeightChange).not.toHaveBeenCalled()
    expect((inst as any).__captchaState.timers.size()).toBe(0)
  })

  it('show observer：首次显示重置 code 并首发；此后不再首发', () => {
    const inst = mountDef(comp.def)
    inst.setData({show: true})
    expect(inst.data.innerShow).toBe(true)
    expect(inst.eventsOf('send')).toHaveLength(1)
    inst.setData({show: false})
    expect(inst.data.innerShow).toBe(false)
    inst.setData({show: true})
    expect(inst.eventsOf('send')).toHaveLength(1) // firstShown 只首发一次
  })

  it('code/errorMsg/disableSend observers：错误态联动与输入清错', () => {
    const inst = mountDef(comp.def)
    inst.setData({errorMsg: '验证码错误'})
    expect(inst.data.isShowErrorStyle).toBe(true)
    inst.setData({disableSend: true})
    expect(inst.data.isShowErrorStyle).toBe(false)
    inst.setData({disableSend: false})
    expect(inst.data.isShowErrorStyle).toBe(true)
    // 输入后清除错误态
    inst.setData({code: '1'})
    expect(inst.data.errorMsg).toBe('')
    expect(inst.data.isShowErrorStyle).toBe(false)
    // 空输入不清错
    inst.setData({errorMsg: '再次错误'})
    inst.setData({code: ''})
    expect(inst.data.errorMsg).toBe('再次错误')
  })

  it("'isView, type' observer：内联判定两路来源", () => {
    const inst = mountDef(comp.def)
    inst.setData({isView: true})
    expect(inst.data.isInline).toBe(true)
    inst.setData({isView: false, type: 'inline'})
    expect(inst.data.isInline).toBe(true)
    inst.setData({type: 'dialog'})
    expect(inst.data.isInline).toBe(false)
  })

  it('onPopupChange/onPopupShow/onPopupHide/close：popup 转发链路', () => {
    const focus = vi.fn()
    const blur = vi.fn()
    const inst = mountDef(comp.def, {
      selectComponent: (selector: string) =>
        selector === '#cu-captcha-codebox' ? {focus, blur} : null,
    })
    inst.methods.onPopupChange.call(inst, {detail: {value: true}})
    expect(inst.data.innerShow).toBe(true)
    expect(inst.eventsOf('change')[0].detail).toEqual({value: true})

    inst.methods.onPopupShow.call(inst)
    expect(focus).toHaveBeenCalledTimes(1)
    expect(inst.eventsOf('show')).toHaveLength(1)

    inst.methods.onPopupHide.call(inst)
    expect(blur).toHaveBeenCalledTimes(1)
    expect(inst.eventsOf('hide')).toHaveLength(1)

    inst.methods.close.call(inst)
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')[1].detail).toEqual({value: false})
  })

  it('onPopupShow/onPopupHide：codebox 缺省（selectComponent null）不崩溃', () => {
    const inst = mountDef(comp.def)
    expect(() => {
      inst.methods.onPopupShow.call(inst)
      inst.methods.onPopupHide.call(inst)
    }).not.toThrow()
  })

  it('onCodeChange/onSubmit：codebox 输入与提交转发', () => {
    const inst = mountDef(comp.def)
    inst.methods.onCodeChange.call(inst, {detail: {value: '1234'}})
    expect(inst.data.code).toBe('1234')
    inst.methods.onSubmit.call(inst, {detail: {value: '1234'}})
    expect(inst.eventsOf('submit')[0].detail).toEqual({value: '1234'})
    expect(() => inst.methods.noop.call(inst)).not.toThrow()
  })

  it('onResend：autoCountdown=false 只发 send；emitSend（autoSend=false）不发', () => {
    const inst = mountDef(comp.def, {props: {autoCountdown: false}})
    inst.methods.onResend.call(inst)
    expect(inst.eventsOf('send')).toHaveLength(1)
    expect(inst.data.isCounting).toBe(false)

    const quiet = mountDef(comp.def, {props: {autoSend: false}})
    quiet.methods.emitSend.call(quiet)
    expect(quiet.events).toEqual([])
  })

  it('countdown：count=0 早退不启动', () => {
    const inst = mountDef(comp.def, {props: {count: 0}})
    inst.methods.countdown.call(inst)
    expect(inst.data.isCounting).toBe(false)
    expect(inst.eventsOf('send')).toHaveLength(0)
  })

  it('countdown：字符串 count 归一化；重入清旧 interval', () => {
    const inst = mountDef(comp.def, {props: {count: '3' as unknown as number}})
    inst.methods.countdown.call(inst)
    expect(inst.data.isCounting).toBe(true)
    expect(inst.data.countBtnText).toBe('3s 后重发')
    inst.methods.countdown.call(inst) // 重入
    expect((inst as any).__captchaState.timers.size()).toBe(1)
  })

  it('countdown：tick 推进文案，归零自动 resetcount（文案回 countNormalText）', () => {
    const inst = mountDef(comp.def, {
      props: {count: 3, countNormalText: '获取验证码', countActiveText: '{$1}s 后重发'},
    })
    inst.methods.countdown.call(inst)
    expect(inst.data.countBtnText).toBe('3s 后重发')
    vi.advanceTimersByTime(1000)
    expect(inst.data.countBtnText).toBe('2s 后重发')
    // 第 2 秒 tick：index = 3-2 = 1 → finished → resetcount
    vi.advanceTimersByTime(1000)
    expect(inst.data.isCounting).toBe(false)
    expect(inst.data.countBtnText).toBe('获取验证码')
    expect((inst as any).__captchaState.counterId).toBeNull()
    expect((inst as any).__captchaState.timers.size()).toBe(0)
  })

  it('resetcount：无进行中倒计时时安全', () => {
    const inst = mountDef(comp.def)
    expect(() => inst.methods.resetcount.call(inst)).not.toThrow()
    expect(inst.data.isCounting).toBe(false)
  })

  it('setError：微任务后写入 errorMsg', async () => {
    const inst = mountDef(comp.def)
    inst.methods.setError.call(inst, '验证码错误')
    await Promise.resolve()
    expect(inst.data.errorMsg).toBe('验证码错误')
  })
})
