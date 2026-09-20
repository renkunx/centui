/**
 * React 表单组件行为清单（Switch/Agree/Stepper/Field/FieldItem/Check/Radio 家族）。
 */
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  CuCheck,
  CuCheckBox,
  CuCheckGroup,
  CuCheckList,
  CuField,
  CuFieldItem,
  CuRadio,
  CuRadioBox,
  CuRadioGroup,
  CuStepper,
  CuSwitch,
  CuAgree,
} from '../../src'

describe('CuSwitch (react)', () => {
  it('toggles via onChange callback', () => {
    const onChange = vi.fn()
    const { container } = render(<CuSwitch value={false} onChange={onChange} />)
    expect(container.querySelector('.cu-switch')!.className).not.toContain('active')

    fireEvent.click(container.querySelector('.cu-switch')!)
    expect(onChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('blocks when disabled', () => {
    const onChange = vi.fn()
    const { container } = render(<CuSwitch value disabled onChange={onChange} />)
    fireEvent.click(container.querySelector('.cu-switch')!)
    expect(onChange).not.toHaveBeenCalled()
    expect(container.querySelector('.cu-switch')!.className).toContain('disabled')
  })
})

describe('CuAgree (react)', () => {
  it('toggles checked state and blocks disabled', () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuAgree value={false} onChange={onChange}>我已阅读并同意协议</CuAgree>,
    )
    expect(container.querySelector('.cu-agree-content')!.textContent).toBe('我已阅读并同意协议')

    fireEvent.click(container.querySelector('.cu-agree-icon')!)
    expect(onChange).toHaveBeenCalledWith(true, expect.anything())

    const disabled = render(<CuAgree disabled onChange={onChange} />)
    fireEvent.click(disabled.container.querySelector('.cu-agree-icon')!)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('supports custom icon slot with checked scope', () => {
    const { container } = render(
      <CuAgree value iconSlot={checked => <span className="custom">{String(checked)}</span>} />,
    )
    expect(container.querySelector('.custom')!.textContent).toBe('true')
    expect(container.querySelector('.cu-icon-checked')).toBeNull()
  })
})

describe('CuStepper (react)', () => {
  it('steps with min/max clamp and callbacks', async () => {
    const onChange = vi.fn()
    const onIncrease = vi.fn()
    const { container, rerender } = render(
      <CuStepper value={1} min={0} max={2} onChange={onChange} onIncrease={onIncrease} />,
    )
    await Promise.resolve()

    const add = container.querySelector('.cu-stepper-button-add')!
    fireEvent.click(add)
    expect(onChange).toHaveBeenLastCalledWith(2)
    expect(onIncrease).toHaveBeenCalledWith(1)

    // 边界：到达 max 后 add 不再触发
    rerender(<CuStepper value={2} min={0} max={2} onChange={onChange} onIncrease={onIncrease} />)
    await Promise.resolve()
    expect(container.querySelector('.cu-stepper-button-add')!.className).toContain('disabled')
    fireEvent.click(container.querySelector('.cu-stepper-button-add')!)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('disables all operations when disabled', () => {
    const onChange = vi.fn()
    const { container } = render(<CuStepper value={1} disabled onChange={onChange} />)
    fireEvent.click(container.querySelector('.cu-stepper-button-add')!)
    fireEvent.click(container.querySelector('.cu-stepper-button-reduce')!)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('input formats junk and clamps on blur', async () => {
    const onChange = vi.fn()
    const { container } = render(<CuStepper value={1} isInteger min={0} onChange={onChange} />)
    await Promise.resolve()
    const input = container.querySelector('input')!
    fireEvent.focus(input)
    fireEvent.input(input, { target: { value: '1x2' } })
    expect(input.value).toBe('12')
    fireEvent.blur(input)
    expect(onChange).toHaveBeenLastCalledWith(12)
  })

  it('warns when min > max', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<CuStepper min={5} max={3} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('minNum is larger than maxNum'))
    warn.mockRestore()
  })
})

describe('CuField / CuFieldItem (react)', () => {
  it('renders slots and modifiers', () => {
    const { container } = render(
      <CuField title="标题" brief="描述" action={<a>操作</a>} footer={<span>尾</span>}>
        <div className="content">内容</div>
      </CuField>,
    )
    expect(container.querySelector('.cu-field-title')!.textContent).toBe('标题')
    expect(container.querySelector('.cu-field-action')!.textContent).toBe('操作')
    expect(container.querySelector('.cu-field-footer')!.textContent).toBe('尾')
    expect(container.querySelector('fieldset')!.className).not.toContain('is-plain')

    const plain = render(<CuField plain disabled />)
    expect(plain.container.querySelector('fieldset')!.className).toContain('is-plain')
    expect(plain.container.querySelector('fieldset')!.className).toContain('is-disabled')
  })

  it('field-item inherits field disabled and blocks click', () => {
    const onClick = vi.fn()
    const { container } = render(
      <CuField disabled>
        <CuFieldItem title="T" onClick={onClick} />
      </CuField>,
    )
    expect(container.querySelector('.cu-field-item')!.className).toContain('is-disabled')
    fireEvent.click(container.querySelector('.cu-field-item')!)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('field-item renders placeholder and arrow', () => {
    const { container } = render(<CuFieldItem title="T" placeholder="占位" arrow />)
    expect(container.querySelector('.cu-field-item-placeholder')!.textContent).toBe('占位')
    expect(container.querySelector('.cu-icon-arrow')).not.toBeNull()
  })
})

describe('Check 家族 (react)', () => {
  it('checkbox toggles with boolean-name inversion', () => {
    const onChange = vi.fn()
    const { container } = render(<CuCheck name onChange={onChange} />)
    fireEvent.click(container.querySelector('.cu-check')!)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('check-box renders base box with tag when checked', () => {
    const onChange = vi.fn()
    const { container } = render(<CuCheckBox name="a" value="a" label="选项" onChange={onChange} />)
    expect(container.querySelector('.cu-check-base-box')!.className).toContain('is-checked')
    expect(container.querySelector('.cu-tag .cu-icon-right')).not.toBeNull()

    fireEvent.click(container.querySelector('.cu-check-base-box')!)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('group manages values with max and toggleAll', () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuCheckGroup value={['a']} max={1} onChange={onChange}>
        <CuCheck name="a" />
        <CuCheck name="b" />
      </CuCheckGroup>,
    )
    fireEvent.click(container.querySelectorAll('.cu-check')[1])
    // max=1 已满 → 不派发
    expect(onChange).not.toHaveBeenCalled()

    const group2 = render(
      <CuCheckGroup value={['a', 'b']} onChange={onChange}>
        <CuCheck name="a" />
        <CuCheck name="b" />
        <CuCheck name="c" disabled />
      </CuCheckGroup>,
    )
    const group = group2.container.querySelector('.cu-check-group')!
    expect(group).not.toBeNull()
  })

  it('check-list renders options and toggles', () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuCheckList
        value={['a']}
        options={[
          { value: 'a', label: '选项一' },
          { value: 'b', label: '选项二', brief: '描述' },
        ]}
        onChange={onChange}
      />,
    )
    const items = container.querySelectorAll('.cu-check-item')
    expect(items[0].className).toContain('is-checked')
    expect(items[1].querySelector('.cu-cell-item-brief')!.textContent).toBe('描述')

    fireEvent.click(items[1])
    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
  })
})

describe('Radio 家族 (react)', () => {
  it('radio selects without deselect', () => {
    const onChange = vi.fn()
    const { container } = render(<CuRadio name="day" value="day" onChange={onChange} />)
    expect(container.querySelector('.cu-radio')!.className).toContain('is-checked')

    fireEvent.click(container.querySelector('.cu-radio')!)
    expect(onChange).toHaveBeenCalledWith('day')
  })

  it('radio-group emits selected name', () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuRadioGroup value="a" onChange={onChange}>
        <CuRadio name="a" />
        <CuRadio name="b" />
      </CuRadioGroup>,
    )
    fireEvent.click(container.querySelectorAll('.cu-radio')[1])
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('radio-box renders and emits', () => {
    const onChange = vi.fn()
    const { container } = render(<CuRadioBox name="b" value="a" onChange={onChange} />)
    expect(container.querySelector('.cu-radio-box, [class*="cu-radio-box"]')).not.toBeNull()
    fireEvent.click(container.querySelector('.cu-check-base-box')!)
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
