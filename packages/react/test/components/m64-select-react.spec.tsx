/**
 * M6-4 React 行为测试：Selector/DropMenu/TabPicker
 */
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CuDropMenu, CuSelector, CuTabPicker } from '../../src'

async function flush(ms = 60) {
  await act(async () => {
    await new Promise(r => setTimeout(r, ms))
  })
}

describe('CuSelector', () => {
  const data = [
    { value: '1', text: '选项一' },
    { value: '2', text: '选项二' },
  ]

  it('closed by default, opens via value', async () => {
    const { container, rerender } = render(<CuSelector data={data} />)
    expect(container.querySelector('.cu-popup-box')?.getAttribute('style')).toContain('display: none')
    rerender(<CuSelector data={data} value />)
    await flush(80)
    expect(container.querySelector('.cu-popup-box')?.getAttribute('style')).not.toContain('display: none')
  })

  it('immediate choose closes and emits choose + onChange', async () => {
    const onChoose = vi.fn()
    const onChange = vi.fn()
    const { container } = render(<CuSelector data={data} value onChange={onChange} onChoose={onChoose} />)
    await flush(80)
    fireEvent.click(container.querySelectorAll('.cu-radio-item')[0])
    await flush(60)
    expect(onChoose).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('okText requires confirm', async () => {
    const onConfirm = vi.fn()
    const { container } = render(
      <CuSelector data={data} value okText="确定" onConfirm={onConfirm} />,
    )
    await flush(80)
    fireEvent.click(container.querySelectorAll('.cu-radio-item')[1])
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.click(container.querySelector('.cu-popup-confirm')!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('multi mode accumulates and confirm emits array', async () => {
    const onConfirm = vi.fn()
    const { container } = render(
      <CuSelector data={data} value multi okText="确定" defaultValue={['1']} onConfirm={onConfirm} />,
    )
    await flush(80)
    fireEvent.click(container.querySelectorAll('.cu-check-item')[1])
    await flush(40)
    fireEvent.click(container.querySelector('.cu-popup-confirm')!)
    expect(onConfirm.mock.calls[0][0]).toEqual(['1', '2'])
  })

  it('cancel resets and emits cancel', async () => {
    const onCancel = vi.fn()
    const { container } = render(
      <CuSelector data={data} value okText="确定" cancelText="取消" onCancel={onCancel} />,
    )
    await flush(80)
    fireEvent.click(container.querySelectorAll('.cu-radio-item')[1])
    fireEvent.click(container.querySelector('.cu-popup-cancel')!)
    expect(onCancel).toHaveBeenCalled()
  })

  it('hideTitleBar hides title bar', () => {
    const { container } = render(<CuSelector data={data} value hideTitleBar />)
    void container
    // hideTitleBar 且无确认 → 标题栏不渲染（v-show 契约：React 条件渲染）
    const { container: c2 } = render(<CuSelector data={data} value hideTitleBar />)
    expect(c2.querySelector('.cu-popup-title-bar')).toBeNull()
  })
})

describe('CuDropMenu', () => {
  const data = [
    { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }] },
    { text: '排序', options: [{ value: '3', text: '默认排序' }, { value: '4', text: '价格' }] },
    { text: '禁用项', disabled: true, options: [] },
  ]

  it('renders bar with default-selected text', () => {
    const { container } = render(<CuDropMenu data={data} defaultValue={['2']} />)
    const items = container.querySelectorAll('.bar-item')
    expect(items[0].textContent).toBe('数码')
    expect(items[0].className).toContain('selected')
    expect(items[2].className).toContain('disabled')
  })

  it('bar click opens popup, list click selects and reports change', async () => {
    const onChange = vi.fn()
    const { container } = render(<CuDropMenu data={data} onChange={onChange} />)
    await flush(40)
    fireEvent.click(container.querySelectorAll('.bar-item')[1])
    await flush(80)
    expect(container.querySelector('.cu-popup-box')?.getAttribute('style')).not.toContain('display: none')
    expect(container.querySelectorAll('.bar-item')[1].className).toContain('active')
    fireEvent.click(container.querySelectorAll('.cu-radio-item')[0])
    await flush(80)
    expect(onChange.mock.calls[0][0].text).toBe('排序')
    expect(onChange.mock.calls[0][1].text).toBe('默认排序')
    expect(container.querySelectorAll('.bar-item')[1].textContent).toBe('默认排序')
  })

  it('disabled bar item blocks open', async () => {
    const { container } = render(<CuDropMenu data={data} />)
    fireEvent.click(container.querySelectorAll('.bar-item')[2])
    await flush(40)
    expect(container.querySelector('.cu-popup-box')?.getAttribute('style')).toContain('display: none')
  })

  it('exposes selected values', () => {
    const ref = { current: null as unknown as { getSelectedValue: (i: number) => { text?: string } } }
    render(<CuDropMenu data={data} defaultValue={['', '4']} ref={ref as never} />)
    void ref.current
    expect(ref.current).not.toBeNull()
  })
})

describe('CuTabPicker', () => {
  const cascadeData = {
    name: 'level1',
    label: '一级',
    options: [
      {
        value: 'zj',
        label: '浙江',
        children: {
          name: 'level2',
          label: '城市',
          options: [
            { value: 'hz', label: '杭州' },
            { value: 'nb', label: '宁波' },
          ],
        },
      },
      { value: 'js', label: '江苏' },
    ],
  }

  it('defaultValue derives panes', () => {
    const { container } = render(<CuTabPicker data={cascadeData} defaultValue={['zj', 'hz']} />)
    expect(container.querySelectorAll('.cu-tab-pane')).toHaveLength(2)
  })

  it('select leaf emits change and closes', async () => {
    const onChange = vi.fn()
    const onSelect = vi.fn()
    const onInput = vi.fn()
    const { container } = render(
      <CuTabPicker data={cascadeData} value onChange={onChange} onSelect={onSelect} onInput={onInput} />,
    )
    await flush(100)
    expect(container.querySelectorAll('.cu-tab-pane')).toHaveLength(1)
    // 一级选浙江
    fireEvent.click(container.querySelectorAll('.cu-radio-item')[0])
    await flush(100)
    expect(onSelect).toHaveBeenCalled()
    expect(container.querySelectorAll('.cu-tab-pane')).toHaveLength(2)
    // 二级选杭州 → 300ms 后 change + 关闭
    fireEvent.click(container.querySelectorAll('.cu-tab-pane')[1].querySelector('.cu-radio-item')!)
    await flush(600)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].values).toEqual(['zj', 'hz'])
    expect(onInput).toHaveBeenCalledWith(false)
  })
})
