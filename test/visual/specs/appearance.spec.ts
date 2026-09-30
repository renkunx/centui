/**
 * L4 视觉回归：双框架稳定场景截图基线（0.1% 像素容差）。
 * 基线变更须随 PR 显式提交（与 L3 golden 同策略）：
 *   更新基线：PLAYWRIGHT_UPDATE=1 pnpm test:visual -- --update-snapshots
 *
 * 注意：截图基线与 OS 字体栅格化绑定（本仓库基线产自 macOS）。CI（Linux）
 * 上像素级比对必然因字体渲染差异失败，故仅在本地运行；CI 由
 * interaction.spec 承担行为回归。
 */
import { expect, test } from '@playwright/test'
import { FRAMEWORKS, STABLE_PAGES, type Framework } from '../app/src/shared'

const BASE: Record<Framework, string> = {
  vue: '/vue.html',
  react: '/react.html',
}

for (const fw of FRAMEWORKS) {
  test.describe(`[${fw}] 视觉基线`, () => {
    test.skip(!!process.env.CI, '截图基线与 OS 字体栅格化绑定，仅本地运行')
    test.use({ baseURL: 'http://localhost:4517' })

    for (const pageId of STABLE_PAGES) {
      test(`${pageId} 场景渲染一致`, async ({ page }) => {
        await page.goto(`${BASE[fw]}#/${pageId}`)
        const scene = page.locator(`.e2e-scene[data-scene="${pageId}"]`)
        await expect(scene).toBeVisible()
        // 字体/图标渲染稳定后再截图
        await page.waitForTimeout(250)
        await expect(scene).toHaveScreenshot({
          maxDiffPixelRatio: 0.001,
          animations: 'disabled',
        })
      })
    }
  })
}
