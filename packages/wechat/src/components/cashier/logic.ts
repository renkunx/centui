/**
 * cashier 纯逻辑（对照 Vue 版 Cashier.vue + CashierChannel.vue + CashierChannelItem/Button.vue）
 */

export type CashierScene = 'choose' | 'captcha' | 'loading' | 'success' | 'fail' | 'custom'

export interface CashierChannel {
  text?: string
  desc?: string
  img?: string
  icon?: string
  value?: string
  disabled?: boolean
  action?: {text: string; handler: () => void}
}

export interface CashierChannelView {
  icon: string
  img: string
  text: string
  desc: string
  actionText: string
  /** check-disabled | checked | check（CashierChannelItem 的 item-check-icon） */
  checkIcon: string
  disabled: boolean
}

/** locale 默认（对齐 @centui/core lang/zh-CN md.cashier） */
export const CASHIER_TEXT = {
  payCash: '支付金额（元）',
  confirmPay: '确定支付',
  morePayWays: '更多支付方式',
  pay: '支付',
  payResultSearch: '支付结果查询中...',
  paySuccess: '支付成功',
  payFail: '支付失败，请稍后重试',
  confirm: '我知道了',
} as const

export function isCashierScene(value: unknown): value is CashierScene {
  return ['choose', 'captcha', 'loading', 'success', 'fail', 'custom'].includes(value as string)
}

/** CashierChannel.isSingle：channelLimit<1 或 channels.length <= channelLimit */
export function isSingleChannel(channels: CashierChannel[], channelLimit: number): boolean {
  if (channelLimit < 1) return true
  return !(channels.length > channelLimit)
}

/** CashierChannelItem 的 check 图标：disabled → check-disabled；active → checked；否则 check */
export function channelCheckIcon(disabled: boolean | undefined, active: boolean): string {
  if (disabled) return 'check-disabled'
  return active ? 'checked' : 'check'
}

/** 渠道项渲染视图（v-html 字段以原文进 rich-text；action handler 抽离实例登记） */
export function buildChannelViews(
  channels: CashierChannel[],
  activeIndex: number,
): CashierChannelView[] {
  return (channels ?? []).map((item, index) => {
    const channel = item ?? {}
    return {
      icon: channel.icon ?? '',
      img: channel.img ?? '',
      text: channel.text ?? '',
      desc: channel.desc ?? '',
      actionText: channel.action?.text ?? '',
      checkIcon: channelCheckIcon(channel.disabled, index === activeIndex),
      disabled: !!channel.disabled,
    }
  })
}

/**
 * Cashier.next 的 Object.assign(target, option)：
 * 可序列化字段并入（handler 函数由组件登记到实例状态，不入 data）。
 */
export function mergeSceneOption<T extends Record<string, unknown>>(
  current: Record<string, Record<string, unknown>>,
  scene: CashierScene,
  option: Record<string, unknown> | undefined,
): T {
  const bucket = {...(current[scene] ?? {})}
  if (option && typeof option === 'object') {
    for (const [key, value] of Object.entries(option)) {
      if (typeof value !== 'function') bucket[key] = value
    }
  }
  return {...current, [scene]: bucket} as unknown as T
}

/** 递归剥离函数（setData 禁止函数——actions 内嵌 handler 一并清除） */
export function stripFunctions<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => stripFunctions(item)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === 'function') continue
      out[key] = stripFunctions(val)
    }
    return out as unknown as T
  }
  return value
}

/** 场景 actions 归一化：success/fail 的 actions || [{buttonText, handler}] */
export function resolveSceneActions(
  option: {actions?: Array<{buttonText?: string; handler?: (() => void) | null}>; buttonText?: string; handler?: (() => void) | null} | undefined,
  fallbackText: string,
): Array<{buttonText: string}> {
  const actions = option?.actions?.length
    ? option.actions
    : [{buttonText: option?.buttonText ?? fallbackText, handler: option?.handler}]
  return actions.map(action => ({buttonText: action?.buttonText ?? ''}))
}
