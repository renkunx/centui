/**
 * notice-bar 纯逻辑（对照 Vue 版 NoticeBar.vue）
 */

/** Vue rightIcon：mode==='link' → arrow，否则 close */
export function rightIcon(mode: string): string {
  return mode === 'link' ? 'arrow' : 'close'
}

/**
 * Vue checkOverflow 核心条件：
 *   contentEl.scrollWidth - paddingLeft > Math.ceil(wrapEl.getBoundingClientRect().width)
 * 小程序以「inline-block 探测态」下内容节点的 boundingClientRect.width 等价
 * scrollWidth（nowrap 下 shrink-to-fit 不收敛、保留自然宽度），padding-left 取
 * 内容节点与包裹节点的左缘差。
 */
export function isOverflow(textWidth: number, paddingLeft: number, wrapWidth: number): boolean {
  return textWidth - paddingLeft > Math.ceil(wrapWidth)
}

/** 根类名：round 修饰符 + 类型（default/activity/warning） */
export function buildBarClass(round: boolean, type: string): string {
  return ['cu-notice-bar', round ? 'cu-notice-bar-round' : '', type].filter(Boolean).join(' ')
}
