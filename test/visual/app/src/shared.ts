/**
 * 双框架共享的场景页清单：Playwright 用例与画廊两端共用同一份 id，
 * 保证 vue.html 与 react.html 渲染完全对齐的场景集。
 *
 * 页面分两类：
 * - stable：确定性静态渲染，参与截图基线（appearance.spec.ts）
 * - interactive：含交互流程，由 interaction.spec.ts 驱动（不截图）
 */
export interface ScenePage {
  id: string
  kind: 'stable' | 'interactive'
}

export const SCENE_PAGES: ScenePage[] = [
  { id: 'button', kind: 'interactive' },
  { id: 'icon', kind: 'stable' },
  { id: 'tag', kind: 'stable' },
  { id: 'amount', kind: 'stable' },
  { id: 'cell-item', kind: 'stable' },
  { id: 'skeleton', kind: 'stable' },
  { id: 'notice-bar', kind: 'stable' },
  { id: 'progress', kind: 'stable' },
  { id: 'switch', kind: 'interactive' },
  { id: 'agree', kind: 'stable' },
  { id: 'stepper', kind: 'interactive' },
  { id: 'field', kind: 'stable' },
  { id: 'check', kind: 'interactive' },
  { id: 'radio', kind: 'interactive' },
  { id: 'input-item', kind: 'interactive' },
  { id: 'textarea-item', kind: 'stable' },
  { id: 'codebox', kind: 'interactive' },
  { id: 'number-keyboard', kind: 'interactive' },
  { id: 'popup', kind: 'interactive' },
  { id: 'popup-title-bar', kind: 'stable' },
  { id: 'dialog', kind: 'interactive' },
  { id: 'action-sheet', kind: 'interactive' },
  { id: 'toast', kind: 'interactive' },
  { id: 'picker', kind: 'interactive' },
  { id: 'date-picker', kind: 'interactive' },
  { id: 'selector', kind: 'interactive' },
  { id: 'drop-menu', kind: 'interactive' },
  { id: 'tab-picker', kind: 'interactive' },
  { id: 'captcha', kind: 'interactive' },
  { id: 'cashier', kind: 'interactive' },
  { id: 'image-viewer', kind: 'stable' },
  { id: 'landscape', kind: 'stable' },
  { id: 'tabs', kind: 'interactive' },
  { id: 'swiper', kind: 'interactive' },
  { id: 'slider', kind: 'stable' },
  { id: 'scroll-view', kind: 'stable' },
  { id: 'result-page', kind: 'stable' },
  { id: 'bill', kind: 'stable' },
  { id: 'water-mark', kind: 'stable' },
  { id: 'chart', kind: 'stable' },
  { id: 'ruler', kind: 'stable' },
  { id: 'steps', kind: 'stable' },
  { id: 'action-bar', kind: 'stable' },
  { id: 'detail-item', kind: 'stable' },
  { id: 'tip', kind: 'stable' },
  { id: 'license-plate', kind: 'interactive' },
  { id: 'image-reader', kind: 'stable' },
  { id: 'transition', kind: 'stable' },
]

export const STABLE_PAGES = SCENE_PAGES.filter(p => p.kind === 'stable').map(p => p.id)
export const INTERACTIVE_PAGES = SCENE_PAGES.filter(p => p.kind === 'interactive').map(p => p.id)

export const FRAMEWORKS = ['vue', 'react'] as const
export type Framework = (typeof FRAMEWORKS)[number]
