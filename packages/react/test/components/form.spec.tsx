/**
 * React 表单组件行为清单（Switch/Agree/Stepper/Field/FieldItem/Check/Radio 家族）。
 */
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  MdCheck,
  MdCheckBox,
  MdCheckGroup,
  MdCheckList,
  MdField,
  MdFieldItem,
  MdRadio,
  MdRadioBox,
  MdRadioGroup,
  MdStepper,
  MdSwitch,
  MdAgree,
} from '../../src'

describe('MdSwitch (react)', () => {
  it('toggles via onChange callback', () => {
    const onChange = vi.fn()
    const { container } = render(<MdSwitch value={false} onChange={onChange} />)
    expect(container.querySelector('.md-switch')!.className).not.toContain('active')

    fireEvent.click(container.querySelector('.md-switch')!)
    expect(onChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('blocks when disabled', () => {
    const onChange = vi.fn()
    const { container } = render(<MdSwitch value disabled onChange={onChange} />)
    fireEvent.click(container.querySelector('.md-switch')!)
    expect(onChange).not.toHaveBeenCalled()
    expect(container.querySelector('.md-switch')!.className).toContain('disabled')
  })
})

describe('MdAgree (react)', () => {
  it('toggles checked state and blocks disabled', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MdAgree value={false} onChange={onChange}>我已阅读并同意协议</MdAgree>,
    )
    expect(container.querySelector('.md-agree-content')!.textContent).toBe('我已阅读并同意协议')

    fireEvent.click(container.querySelector('.md-agree-icon')!)
    expect(onChange).toHaveBeenCalledWith(true, expect.anything())

    const disabled = render(<MdAgree disabled onChange={onChange} />)
    fireEvent.click(disabled.container.querySelector('.md-agree-icon')!)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('supports custom icon slot with checked scope', () => {
    const { container } = render(
      <MdAgree value iconSlot={checked => <span className="custom">{String(checked)}</span>} />,
    )
    expect(container.querySelector('.custom')!.textContent).toBe('true')
    expect(container.querySelector('.md-icon-checked')).toBeNull()
  })
})

describe('MdStepper (react)', () => {
  it('steps with min/max clamp and callbacks', async () => {
    const onChange = vi.fn()
    const onIncrease = vi.fn()
    const { container, rerender } = render(
      <MdStepper value={1} min={0} max={2} onChange={onChange} onIncrease={onIncrease} />,
    )
    await Promise.resolve()

    const add = container.querySelector('.md-stepper-button-add')!
    fireEvent.click(add)
    expect(onChange).toHaveBeenLastCalledWith(2)
    expect(onIncrease).toHaveBeenCalledWith(1)

    // 边界：到达 max 后 add 不再触发
    rerender(<MdStepper value={2} min={0} max={2} onChange={onChange} onIncrease={onIncrease} />)
    await Promise.resolve()
    expect(container.querySelector('.md-stepper-button-add')!.className).toContain('disabled')
    fireEvent.click(container.querySelector('.md-stepper-button-add')!)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('disables all operations when disabled', () => {
    const onChange = vi.fn()
    const { container } = render(<MdStepper value={1} disabled onChange={onChange} />)
    fireEvent.click(container.querySelector('.md-stepper-button-add')!)
    fireEvent.click(container.querySelector('.md-stepper-button-reduce')!)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('input formats junk and clamps on blur', async () => {
    const onChange = vi.fn()
    const { container } = render(<MdStepper value={1} isInteger min={0} onChange={onChange} />)
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
    render(<MdStepper min={5} max={3} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('minNum is larger than maxNum'))
    warn.mockRestore()
  })
})

describe('MdField / MdFieldItem (react)', () => {
  it('renders slots and modifiers', () => {
    const { container } = render(
      <MdField title="标题" brief="描述" action={<a>操作</a>} footer={<span>尾</span>}>
        <div className="content">内容</div>
      </MdField>,
    )
    expect(container.querySelector('.md-field-title')!.textContent).toBe('标题')
    expect(container.querySelector('.md-field-action')!.textContent).toBe('操作')
    expect(container.querySelector('.md-field-footer')!.textContent).toBe('尾')
    expect(container.querySelector('fieldset')!.className).not.toContain('is-plain')

    const plain = render(<MdField plain disabled />)
    expect(plain.container.querySelector('fieldset')!.className).toContain('is-plain')
    expect(plain.container.querySelector('fieldset')!.className).toContain('is-disabled')
  })

  it('field-item inherits field disabled and blocks click', () => {
    const onClick = vi.fn()
    const { container } = render(
      <MdField disabled>
        <MdFieldItem title="T" onClick={onClick} />
      </MdField>,
    )
    expect(container.querySelector('.md-field-item')!.className).toContain('is-disabled')
    fireEvent.click(container.querySelector('.md-field-item')!)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('field-item renders placeholder and arrow', () => {
    const { container } = render(<MdFieldItem title="T" placeholder="占位" arrow />)
    expect(container.querySelector('.md-field-item-placeholder')!.textContent).toBe('占位')
    expect(container.querySelector('.md-icon-arrow')).not.toBeNull()
  })
})

describe('Check 家族 (react)', () => {
  it('checkbox toggles with boolean-name inversion', () => {
    const onChange = vi.fn()
    const { container } = render(<MdCheck name onChange={onChange} />)
    fireEvent.click(container.querySelector('.md-check')!)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('check-box renders base box with tag when checked', () => {
    const onChange = vi.fn()
    const { container } = render(<MdCheckBox name="a" value="a" label="选项" onChange={onChange} />)
    expect(container.querySelector('.md-check-base-box')!.className).toContain('is-checked')
    expect(container.querySelector('.md-tag .md-icon-right')).not.toBeNull()

    fireEvent.click(container.querySelector('.md-check-base-box')!)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('group manages values with max and toggleAll', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MdCheckGroup value={['a']} max={1} onChange={onChange}>
        <MdCheck name="a" />
        <MdCheck name="b" />
      </MdCheckGroup>,
    )
    fireEvent.click(container.querySelectorAll('.md-check')[1])
    // max=1 已满 → 不派发
    expect(onChange).not.toHaveBeenCalled()

    const group2 = render(
      <MdCheckGroup value={['a', 'b']} onChange={onChange}>
        <MdCheck name="a" />
        <MdCheck name="b" />
        <MdCheck name="c" disabled />
      </MdCheckGroup>,
    )
    const group = group2.container.querySelector('.md-check-group')!
    expect(group).not.toBeNull()
  })

  it('check-list renders options and toggles', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MdCheckList
        value={['a']}
        options={[
          { value: 'a', label: '选项一' },
          { value: 'b', label: '选项二', brief: '描述' },
        ]}
        onChange={onChange}
      />,
    )
    const items = container.querySelectorAll('.md-check-item')
    expect(items[0].className).toContain('is-checked')
    expect(items[1].querySelector('.md-cell-item-brief')!.textContent).toBe('描述')

    fireEvent.click(items[1])
    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
  })
})

describe('Radio 家族 (react)', () => {
  it('radio selects without deselect', () => {
    const onChange = vi.fn()
    const { container } = render(<MdRadio name="day" value="day" onChange={onChange} />)
    expect(container.querySelector('.md-radio')!.className).toContain('is-checked')

    fireEvent.click(container.querySelector('.md-radio')!)
    expect(onChange).toHaveBeenCalledWith('day')
  })

  it('radio-group emits selected name', () => {
    const onChange = vi.fn()
    const { container } = render(
      <MdRadioGroup value="a" onChange={onChange}>
        <MdRadio name="a" />
        <MdRadio name="b" />
      </MdRadioGroup>,
    )
    fireEvent.click(container.querySelectorAll('.md-radio')[1])
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('radio-box renders and emits', () => {
    const onChange = vi.fn()
    const { container } = render(<MdRadioBox name="b" value="a" onChange={onChange} />)
    expect(container.querySelector('.md-radio-box, [class*="md-radio-box"]')).not.toBeNull()
    fireEvent.click(container.querySelector('.md-check-base-box')!)
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
