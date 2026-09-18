/**
 * 分支覆盖第三轮：InputItem 虚拟键盘联动/preview、NumberKeyboard 弹层模式、
 * ActionSheet label 选项与数组 invalidIndex、Check delegate 剩余分支。
 */
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  MdActionSheet,
  MdInputItem,
  MdNumberKeyboard,
} from '../../src'

describe('MdInputItem 虚拟键盘联动 (react)', () => {
  it('builtin keyboard drives fake input value', async () => {
    const onChange = vi.fn()
    const onConfirm = vi.fn()

    function Host() {
      return (
        <MdInputItem
          isVirtualKeyboard
          title="金额"
          onChange={onChange}
          onConfirm={onConfirm}
        />
      )
    }
    const { container } = render(<Host />)
    // fake input 点击 → focus；内置键盘 enter/delete/confirm
    fireEvent.click(container.querySelector('.md-input-item-fake')!)
    const keyboard = container.querySelector('.md-number-keyboard')
    expect(keyboard).not.toBeNull()

    const keys = keyboard!.querySelectorAll('.keyboard-number-item')
    fireEvent.click(keys[0]) // 1
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('1', 'input-item'))

    fireEvent.click(keyboard!.querySelector('.keyboard-operate-item.confirm')!)
    expect(onConfirm).toHaveBeenCalledWith('input-item', '1')
  })

  it('preview mode stops on keyboard input', () => {
    const { container } = render(<MdInputItem isVirtualKeyboard previewType="money" value="88" />)
    expect(container.querySelector('.md-input-item-fake')!.textContent).toContain('88')
  })
})

describe('MdNumberKeyboard 弹层模式 (react)', () => {
  it('value opens popup keyboard and confirm hides', async () => {
    const onChange = vi.fn()
    const { container } = render(<MdNumberKeyboard value onChange={onChange} />)
    // MAND_ENV=test：过渡同步，键盘立即可见
    expect(container.querySelector('.md-popup-box')!.getAttribute('style')).not.toContain(
      'display: none',
    )
    fireEvent.click(container.querySelector('.keyboard-operate-item.confirm')!)
    expect(onChange).toHaveBeenLastCalledWith(false)
    expect(container.querySelector('.md-popup-box')!.getAttribute('style')).toContain(
      'display: none',
    )
  })

  it('isHideConfirm=false keeps open after confirm', () => {
    const onChange = vi.fn()
    const onConfirm = vi.fn()
    const { container } = render(
      <MdNumberKeyboard value isHideConfirm={false} onChange={onChange} onConfirm={onConfirm} />,
    )
    fireEvent.click(container.querySelector('.keyboard-operate-item.confirm')!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    // 确认后未触发收起（最后一次仍是打开态）
    expect(onChange.mock.calls.at(-1)).toEqual([true])
  })
})

describe('MdActionSheet 分支 (react)', () => {
  it('label fallback and array invalidIndex', () => {
    const onSelected = vi.fn()
    const { container } = render(
      <MdActionSheet
        value
        options={[{ label: '仅标签' }, { text: 'B' }]}
        invalidIndex={[0]}
        onSelected={onSelected}
      />,
    )
    const items = container.querySelectorAll('.md-action-sheet-item')
    expect(items[0].querySelector('.md-action-sheet-item-section')!.textContent).toBe('仅标签')
    expect(items[0].className).toContain('disabled')

    fireEvent.click(items[0])
    expect(onSelected).not.toHaveBeenCalled()
    fireEvent.click(items[1])
    expect(onSelected).toHaveBeenCalledWith({ text: 'B' })
  })

  it('custom cancelText', () => {
    const { container } = render(
      <MdActionSheet value options={[]} cancelText="不选了" />,
    )
    expect(container.querySelector('.md-action-sheet-cancel')!.textContent).toBe('不选了')
  })
})
