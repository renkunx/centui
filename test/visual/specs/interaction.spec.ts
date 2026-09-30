/**
 * L4 交互 e2e：双框架同场景驱动，断言行为契约（事件回调、状态回显、
 * 弹层开合）。场景页见 test/visual/app（vue.html / react.html）。
 */
import { expect, test } from '@playwright/test'
import { FRAMEWORKS, type Framework } from '../app/src/shared'

const BASE: Record<Framework, string> = {
  vue: '/vue.html',
  react: '/react.html',
}

for (const fw of FRAMEWORKS) {
  test.describe(`[${fw}] 交互契约`, () => {
    test.use({ baseURL: 'http://localhost:4517' })

    async function openPage(page: import('@playwright/test').Page, id: string) {
      await page.goto(`${BASE[fw]}#/${id}`)
      await expect(page.locator(`.e2e-scene[data-scene="${id}"]`)).toBeVisible()
    }

    test('button：点击计数状态回显', async ({ page }) => {
      await openPage(page, 'button')
      await page.click('[data-e2e="btn-plain"]')
      await page.click('[data-e2e="btn-plain"]')
      await expect(page.locator('[data-e2e="btn-count"]')).toHaveText('2')
    })

    test('switch：点击切换开/关', async ({ page }) => {
      await openPage(page, 'switch')
      await expect(page.locator('[data-e2e="switch-state"]')).toHaveText('开')
      await page.click('[data-e2e="switch"].cu-switch, [data-e2e="switch"] .cu-switch')
      await expect(page.locator('[data-e2e="switch-state"]')).toHaveText('关')
    })

    test('stepper：加/减与边界禁用', async ({ page }) => {
      await openPage(page, 'stepper')
      const add = page.locator('[data-e2e="stepper"] .cu-stepper-button-add')
      const reduce = page.locator('[data-e2e="stepper"] .cu-stepper-button-reduce')
      await add.click()
      await expect(page.locator('[data-e2e="stepper-state"]')).toHaveText('4')
      // max=5：连加到 5 后加键禁用
      await add.click()
      await add.click()
      await expect(page.locator('[data-e2e="stepper-state"]')).toHaveText('5')
      await expect(add).toHaveClass(/disabled/)
      await reduce.click()
      await expect(page.locator('[data-e2e="stepper-state"]')).toHaveText('4')
    })

    test('check：多选回显', async ({ page }) => {
      await openPage(page, 'check')
      await expect(page.locator('[data-e2e="check-state"]')).toHaveText('day')
      await page.click('[data-e2e="check-list"] .cu-check-item >> nth=1')
      await expect(page.locator('[data-e2e="check-state"]')).toHaveText(/month/)
    })

    test('radio：单选切换', async ({ page }) => {
      await openPage(page, 'radio')
      await expect(page.locator('[data-e2e="radio-state"]')).toHaveText('0')
      await page.click('[data-e2e="radio-list"] .cu-radio-item >> nth=1')
      await expect(page.locator('[data-e2e="radio-state"]')).toHaveText('1')
    })

    test('input-item：输入回显', async ({ page }) => {
      await openPage(page, 'input-item')
      const input = page.locator('[data-e2e="input"] input')
      await input.fill('6222 0202 0000')
      await expect(page.locator('[data-e2e="input-state"]')).toContainText('6222')
    })

    test('codebox：键入提交', async ({ page }) => {
      await openPage(page, 'codebox')
      const box = page.locator('[data-e2e="codebox"]')
      await box.click()
      await page.keyboard.type('1234', { delay: 60 })
      await expect(page.locator('[data-e2e="code-state"]')).toHaveText('1234')
    })

    test('number-keyboard：唤起、屏上键位录入与删除', async ({ page }) => {
      await openPage(page, 'number-keyboard')
      await page.click('[data-e2e="kb-open"]')
      const keys = page.locator('.keyboard-number-item')
      await expect(keys.first()).toBeVisible({ timeout: 5000 })
      await keys.nth(0).click()
      await keys.nth(1).click()
      await expect(page.locator('[data-e2e="kb-buffer"]')).toHaveText('12')
      await page.locator('.keyboard-operate-item.delete').click()
      await expect(page.locator('[data-e2e="kb-buffer"]')).toHaveText('1')
    })

    test('popup：打开与遮罩关闭', async ({ page }) => {
      await openPage(page, 'popup')
      await page.click('[data-e2e="popup-open"]')
      await expect(page.locator('[data-e2e="popup-state"]')).toHaveText('opened')
      await expect(page.locator('.cu-popup-box')).toBeVisible()
      await page.click('.cu-popup-mask', { position: { x: 10, y: 10 } })
      await expect(page.locator('[data-e2e="popup-state"]')).toHaveText('closed')
    })

    test('dialog：确认回调与关闭', async ({ page }) => {
      await openPage(page, 'dialog')
      await page.click('[data-e2e="dialog-open"]')
      await expect(page.locator('.cu-dialog .cu-popup-box')).toBeVisible()
      await page.locator('.cu-dialog-btn', { hasText: '确定' }).click()
      await expect(page.locator('[data-e2e="dialog-state"]')).toHaveText('confirmed')
    })

    test('dialog：单例 API 渲染警告弹窗', async ({ page }) => {
      await openPage(page, 'dialog')
      await page.click('[data-e2e="dialog-alert"]')
      await expect(page.locator('.cu-dialog .cu-popup-box', { hasText: '警告' })).toBeVisible()
    })

    test('action-sheet：选择回调', async ({ page }) => {
      await openPage(page, 'action-sheet')
      await page.click('[data-e2e="sheet-open"]')
      const item = page.locator('.cu-action-sheet-list li')
      await item.filter({ hasText: '选项一' }).click()
      await expect(page.locator('[data-e2e="sheet-state"]')).toHaveText('选项一')
    })

    test('toast：显示与内容', async ({ page }) => {
      await openPage(page, 'toast')
      await page.click('[data-e2e="toast-text"]')
      await expect(page.locator('.cu-toast')).toContainText('一段文字提示')
      await page.click('[data-e2e="toast-hide"]')
    })

    test('picker：打开确认回传选中值', async ({ page }) => {
      await openPage(page, 'picker')
      await page.click('[data-e2e="picker-open"]')
      await expect(page.locator('.cu-picker .cu-popup-box')).toBeVisible()
      await page.locator('.cu-picker .cu-popup-confirm').click()
      await expect(page.locator('[data-e2e="picker-state"]')).toHaveText(/浙江|江苏|广东/)
    })

    test('date-picker：确认回传日期', async ({ page }) => {
      await openPage(page, 'date-picker')
      await page.click('[data-e2e="date-open"]')
      await expect(page.locator('.cu-picker .cu-popup-box')).toBeVisible()
      await page.locator('.cu-picker .cu-popup-confirm').click()
      await expect(page.locator('[data-e2e="date-state"]')).toContainText('-')
    })

    test('selector：选择回传', async ({ page }) => {
      await openPage(page, 'selector')
      await page.click('[data-e2e="selector-open"]')
      const item = page.locator('.cu-selector .cu-radio-item')
      await item.nth(1).click()
      await expect(page.locator('[data-e2e="selector-state"]')).toHaveText(/进行中|ok:进行中/)
    })

    test('drop-menu：bar 选中回填', async ({ page }) => {
      await openPage(page, 'drop-menu')
      await page.click('[data-e2e="drop-menu"] .bar-item >> nth=0')
      const option = page.locator('.cu-drop-menu-list .cu-radio-item, .cu-drop-menu-list [class*="radio-item"]')
      await option.first().click()
      await expect(page.locator('[data-e2e="drop-menu"] .bar-item').first()).toContainText('1km')
    })

    test('tab-picker：级联选择 change', async ({ page }) => {
      await openPage(page, 'tab-picker')
      await page.click('[data-e2e="tabpicker-open"]')
      await page.locator('.cu-radio-item').first().click()
      const secondPane = page.locator('.cu-tab-pane').nth(1)
      const leaf = secondPane.locator('.cu-radio-item').first()
      await expect(leaf).toBeVisible({ timeout: 5000 })
      await leaf.click()
      await expect(page.locator('[data-e2e="tabpicker-state"]')).toHaveText(/zj\/(hz|nb)/, { timeout: 8000 })
    })

    test('captcha：内联倒计时按钮', async ({ page }) => {
      await openPage(page, 'captcha')
      const btn = page.locator('[data-e2e="captcha"] .cu-captcha-btn').first()
      await expect(btn).toBeVisible()
      await expect(btn).toContainText(/5|重新发送|后重发/)
    })

    test('cashier：通道选择与支付回调', async ({ page }) => {
      await openPage(page, 'cashier')
      await page.click('[data-e2e="cashier-open"]')
      await expect(page.locator('.cu-cashier .cu-popup-box')).toBeVisible()
      const channel = page.locator('.cu-cashier-channel-item')
      await channel.nth(1).click()
      await page.locator('.cu-cashier-pay-button').click()
      await expect(page.locator('[data-e2e="cashier-state"]')).toHaveText('pay:支付宝')
    })

    test('tabs：切换面板', async ({ page }) => {
      await openPage(page, 'tabs')
      await expect(page.locator('[data-e2e="tab-pane"]')).toBeVisible()
      await page.locator('[data-e2e="tabs"] .cu-tab-bar-item >> nth=1').click()
      await expect(page.locator('[data-e2e="tabs"]')).toContainText('pane-b')
    })

    test('swiper：next/prev 公共方法与索引回显', async ({ page }) => {
      await openPage(page, 'swiper')
      await expect(page.locator('[data-e2e="swiper-state"]')).toHaveText('0')
      await page.click('[data-e2e="swiper-next"]')
      await expect(page.locator('[data-e2e="swiper-state"]')).toHaveText('1')
      await page.click('[data-e2e="swiper-prev"]')
      await expect(page.locator('[data-e2e="swiper-state"]')).toHaveText('0')
    })

    test('license-plate：默认值渲染', async ({ page }) => {
      await openPage(page, 'license-plate')
      await expect(page.locator('[data-e2e="plate"]')).toContainText('浙')
      await expect(page.locator('[data-e2e="plate"]')).toContainText('12345')
    })

    test('image-viewer：图片浏览器打开态', async ({ page }) => {
      await openPage(page, 'image-viewer')
      await expect(
        page.locator('.cu-popup-box, [class*="image-viewer"]').last(),
      ).toBeVisible()
    })
  })
}
