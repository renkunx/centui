import { defineConfig, devices } from '@playwright/test'

/**
 * L4 e2e/视觉回归：
 * - 交互契约：test/visual/specs/interaction.spec.ts（双框架行为驱动）
 * - 视觉基线：test/visual/specs/appearance.spec.ts（0.1% 像素容差，基线随 PR 提交）
 * 场景页由 test/visual/app（@centui/e2e）提供：/vue.html 与 /react.html 双入口。
 */
export default defineConfig({
  testDir: './test/visual/specs',
  snapshotPathTemplate: '{testDir}/screenshots/{testName}/{projectName}{ext}',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 6,
  retries: process.env.CI ? 2 : 0,
  // 场景页依赖 workspace dist（centui / @centui/react）与本包构建产物，
  // 运行前须 pnpm build（根 build 已含 @centui/e2e）
  webServer: {
    command: 'pnpm --filter @centui/e2e run preview',
    url: 'http://localhost:4517/vue.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://localhost:4517',
    viewport: { width: 375, height: 667 }, // 移动端视口
    deviceScaleFactor: 2,
  },
  projects: [{ name: 'chrome-mobile', use: { ...devices['Desktop Chrome'] } }],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },
})
