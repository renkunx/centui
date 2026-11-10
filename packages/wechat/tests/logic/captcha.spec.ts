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
