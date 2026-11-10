/**
 * landscape 纯逻辑（对照 Vue 版 Landscape.vue）
 */

/** Vue actualTransition：transition ?? (fullScreen ? 'cu-fade' : 'cu-punch')；
 *  小程序过渡名不带 cu- 前缀（popup 约定），兼容剥除 Vue 风格前缀 */
export function resolveTransition(transition: string, fullScreen: boolean): string {
  const name = (transition || '').replace(/^cu-/, '')
  return name || (fullScreen ? 'fade' : 'punch')
}

/** Vue :has-mask="!fullScreen && hasMask" */
export function hasMask(fullScreen: boolean, hasMask: boolean): boolean {
  return !fullScreen && hasMask
}

/** 关闭图标：全屏 clear，否则 close */
export function closeIcon(fullScreen: boolean): string {
  return fullScreen ? 'clear' : 'close'
}

/** 关闭图标着色（Vue .dark 类：无遮罩或全屏时深色半透明；mask 图标以 color 承担色相） */
export function closeColor(fullScreen: boolean, hasMask: boolean): string {
  return !hasMask || fullScreen
    ? 'var(--color-text-base)'
    : 'var(--color-text-base-inverse)'
}
