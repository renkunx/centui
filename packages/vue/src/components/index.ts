/** 首批组件名（kebab-case），与按需入口文件、样式产物一一对应 */
export const componentNames = [
  'action-sheet',
  'activity-indicator',
  'agree',
  'amount',
  'button',
  'cell-item',
  'check',
  'check-base',
  'dialog',
  'field',
  'icon',
  'notice-bar',
  'popup',
  'progress',
  'radio',
  'skeleton',
  'stepper',
  'switch',
  'tag',
  'tip',
  'toast',
] as const

export type ComponentName = (typeof componentNames)[number]
