/**
 * captcha 纯逻辑（对照 Vue 版 Captcha.vue countdown 状态机）
 */

export const CAPTCHA_TEXT = {
  sendCaptcha: '发送验证码',
  countdown: '{$1}s 后重发',
} as const

/** Vue countActiveText.replace('{$1}', String(i)) */
export function formatCountdown(template: string, i: number): string {
  return template.replace('{$1}', String(i))
}

/**
 * Vue countdown() 的 interval tick 换算：
 * i = count - floor((now - startTimestamp) / 1000)；i<=1 时归位（resetcount，文案由调用方取 countNormalText）。
 */
export function computeCountdown(
  count: number,
  startTimestamp: number,
  now: number,
  activeTemplate: string = CAPTCHA_TEXT.countdown,
): {index: number; text: string; finished: boolean} {
  const index = count - Math.floor((now - startTimestamp) / 1000)
  if (index <= 1) {
    return {index: 1, text: '', finished: true}
  }
  return {index, text: formatCountdown(activeTemplate, index), finished: false}
}
