/**
 * S1 弹层体系集成测试（真实事件路径）。
 *
 * 本文件通过 vi.hoisted 在模块加载前移除 MAND_ENV，使 Popup 以「生产模式」加载
 * （isTestEnv=false）：过渡完成由 transitionend/animationend + duration 兜底驱动，
 * 用于验证既有测试（MAND_ENV=test 同步触发）覆盖不到的真实路径：
 *   - onShow/onHide 由真实事件/兜底触发且幂等
 *   - 命令式工厂（Dialog/ActionSheet/Toast）卸载不依赖过渡事件，必然清理容器
 *   - Captcha 打开自动聚焦（S1 修复后的 onShow 路径）
 *   - NumberKeyboard 受控 value=false 可关闭（S3）
 *   - StrictMode 下 Captcha autoSend 仅触发一次
 */
import { act, fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// 必须先于本文件全部模块加载执行（vi.hoisted 提升到 imports 之前）
vi.hoisted(() => {
  delete (process.env as Record<string, string | undefined>).MAND_ENV
})

import { CuNumberKeyboard } from '../../src/components/number-keyboard/NumberKeyboard'
import { CuCaptcha } from '../../src/components/captcha/Captcha'
import { CuPopup } from '../../src/components/popup/Popup'

async function flush(ms = 50) {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms))
  })
}

/** 轮询等待：跨包调度器（React scheduler vs setTimeout）时序不稳定时保证收敛 */
async function flushUntil(check: () => boolean, maxMs = 2000) {
  const deadline = Date.now() + maxMs
  while (!check() && Date.now() < deadline) {
    await flush(50)
  }
}

describe('S1 弹层过渡：生产模式真实事件路径', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('无动画环境：show 后由兜底触发 onShow', async () => {
    const onShow = vi.fn()
    render(<CuPopup value onShow={onShow} />)
    // duration=0 → 兜底 setTimeout(0) 下一拍完成
    await flush(30)
    expect(onShow).toHaveBeenCalledTimes(1)
  })

  it('transitionend 驱动：onHide 触发且幂等（早于兜底定时器）', async () => {
    const computed = {
      transitionDuration: '0.3s',
      animationDuration: '0s',
      getPropertyValue: () => '',
    }
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(() => computed as unknown as CSSStyleDeclaration)
    const onShow = vi.fn()
    const onHide = vi.fn()
    const { container, rerender } = render(<CuPopup value onShow={onShow} />)

    // 打开路径：不派发事件时由 duration+100ms 兜底触发
    await flush(450)
    expect(onShow).toHaveBeenCalledTimes(1)

    // 关闭路径：真实 transitionend 先于兜底触发，且重复派发被幂等闩吸收
    rerender(<CuPopup value={false} onHide={onHide} />)
    await act(async () => {
      const box = container.querySelector('.cu-popup-box') as HTMLElement
      box.dispatchEvent(new Event('transitionend', { bubbles: true }))
      box.dispatchEvent(new Event('transitionend', { bubbles: true }))
      await Promise.resolve()
    })
    expect(onHide).toHaveBeenCalledTimes(1)
    // 关闭完成后外层容器回收 display（isPopupShow 复位）
    await flush(450)
    const root = container.querySelector('.cu-popup') as HTMLElement
    expect(root.style.display).toBe('none')
    spy.mockRestore()
  })

  it('Dialog 工厂：close 必然卸载 root 并移除容器（不依赖过渡事件）', async () => {
    const mod = await import('../../src/components/dialog')
    const Dialog = mod.default
    const onHide = vi.fn()
    const vm1 = Dialog.confirm({ content: '确认扣款', onHide })
    await flush(30)
    expect(document.querySelectorAll('.cu-dialog').length).toBeGreaterThan(0)

    const vm2 = Dialog.confirm({ content: '第二个' })
    await flush(30)
    vm1.close()
    vm2.close()
    await flushUntil(() => document.querySelectorAll('.cu-dialog').length === 0)
    expect(document.querySelectorAll('.cu-dialog')).toHaveLength(0)
    expect(onHide).toHaveBeenCalled()

    // closeAll 清理剩余实例（打开新实例后直接批量关闭）
    Dialog.confirm({ content: '批量' })
    await flush(30)
    Dialog.closeAll()
    await flushUntil(() => document.querySelectorAll('.cu-dialog').length === 0)
    expect(document.querySelectorAll('.cu-dialog')).toHaveLength(0)
  })

  it('ActionSheet 工厂：create(value=false) 后 close 也清理容器', async () => {
    const mod = await import('../../src/components/action-sheet')
    const ActionSheet = mod.default
    const inst = ActionSheet.create({ value: false, options: [{ text: 'A' }] })
    await flush(30)
    expect(document.querySelectorAll('.cu-action-sheet').length).toBeGreaterThan(0)
    inst.close()
    await flushUntil(() => document.querySelectorAll('.cu-action-sheet').length === 0)
    expect(document.querySelectorAll('.cu-action-sheet')).toHaveLength(0)
  })

  it('ActionSheet 工厂：选中选项后经 onChange 关闭并清理容器', async () => {
    const mod = await import('../../src/components/action-sheet')
    const ActionSheet = mod.default
    const onSelected = vi.fn()
    ActionSheet.create({ value: true, options: [{ text: 'A' }, { text: 'B' }], onSelected })
    await flush(30)
    const items = document.querySelectorAll('.cu-action-sheet-item')
    fireEvent.click(items[0])
    expect(onSelected).toHaveBeenCalledTimes(1)
    await flushUntil(() => document.querySelectorAll('.cu-action-sheet').length === 0)
    expect(document.querySelectorAll('.cu-action-sheet')).toHaveLength(0)
  })

  it('Toast 工厂：destroy 卸载单例并移除容器', async () => {
    const Toast = (await import('../../src/components/toast')).default
    Toast({ content: '处理中' })
    await flush(30)
    expect(document.querySelectorAll('.cu-toast').length).toBeGreaterThan(0)
    Toast.destroy()
    await flushUntil(() => document.querySelectorAll('.cu-toast').length === 0)
    expect(document.querySelectorAll('.cu-toast')).toHaveLength(0)
    // 销毁后可重建
    Toast({ content: '再次' })
    await flush(30)
    expect(document.querySelectorAll('.cu-toast').length).toBeGreaterThan(0)
    Toast.destroy()
    await flushUntil(() => document.querySelectorAll('.cu-toast').length === 0)
  })
})

describe('S1 修复后的行为补强', () => {
  it('Captcha 打开时自动聚焦输入框（system 键盘）并触发 onShow', async () => {
    const onShow = vi.fn()
    const { container } = render(<CuCaptcha value system type="dialog" onShow={onShow} />)
    await flush(60)
    expect(onShow).toHaveBeenCalledTimes(1)
    const input = container.querySelector('input.cu-codebox-input') as HTMLInputElement
    expect(document.activeElement).toBe(input)
  })

  it('NumberKeyboard 受控 value=false 可关闭（S3）', async () => {
    const onChange = vi.fn()
    const { container, rerender } = render(<CuNumberKeyboard value onChange={onChange} />)
    await flush(30)
    expect(container.querySelector('.cu-popup-box')?.getAttribute('style')).not.toContain('display: none')
    rerender(<CuNumberKeyboard value={false} onChange={onChange} />)
    await flush(60)
    expect(container.querySelector('.cu-popup-box')?.getAttribute('style')).toContain('display: none')
    expect(onChange.mock.calls.at(-1)).toEqual([false])
  })

  it('StrictMode 下 Captcha autoSend 仅触发一次', async () => {
    const onSend = vi.fn()
    render(
      <StrictMode>
        <CuCaptcha isView autoSend onSend={onSend} />
      </StrictMode>,
    )
    await flush(60)
    expect(onSend).toHaveBeenCalledTimes(1)
  })
})
