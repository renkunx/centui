import { defineConfig, devices } from '@playwright/test'

/**
 * L4 视觉回归基建：M3/M4 组件落地后，双框架 playground 同场景截图比对。
 * 0.1% 像素容差，基线变更须随 PR 显式提交（golden 与视觉基线同策略）。
 */
export default defineConfig({
  testDir: './test/visual',
  snapshotPathTemplate: '{testDir}/screenshots/{testName}/{projectName}{ext}',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    viewport: { width: 375, height: 667 }, // 移动端视口
    deviceScaleFactor: 2,
  },
  projects: [
    { name: 'chrome-mobile', use: { ...devices['Desktop Chrome'] } },
  ],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },
})
