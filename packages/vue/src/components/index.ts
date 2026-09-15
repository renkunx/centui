/** 首批组件名（kebab-case），与按需入口文件、样式产物一一对应 */
export const componentNames = [
  'activity-indicator',
  'agree',
  'amount',
  'button',
  'cell-item',
  'icon',
  'notice-bar',
  'progress',
  'skeleton',
  'stepper',
  'switch',
  'tag',
] as const

export type ComponentName = (typeof componentNames)[number]
