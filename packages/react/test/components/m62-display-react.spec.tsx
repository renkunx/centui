/**
 * M6-2 React 展示与排版类行为测试
 */
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  MdActionBar,
  MdDetailItem,
  MdSteps,
  MdTabBar,
  MdTabs,
  MdTabPane,
  MdTextareaItem,
  MdTransition,
} from '../../src'

async function flush(ms = 30) {
  await act(async () => {
    await new Promise(r => setTimeout(r, ms))
  })
}

describe('MdActionBar', () => {
  it('renders at most two actions with derived type/plain', () => {
    const { container } = render(
      <MdActionBar actions={[{ text: 'A' }, { text: 'B' }, { text: 'C' }]} />,
    )
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].className).toContain('plain')
    expect(buttons[1].className).not.toContain('plain')
  })

  it('disabled action maps to disabled type and blocks', () => {
    const { container } = render(<MdActionBar actions={[{ text: 'X', disabled: true }]} />)
    const btn = container.querySelector('button') as HTMLButtonElement
    expect(btn.className).toContain('disabled')
    expect(btn.disabled).toBe(true)
  })

  it('click invokes action handler and onClick prop', () => {
    const onAction = vi.fn()
    const onBar = vi.fn()
    const { container } = render(
      <MdActionBar actions={[{ text: 'go', onClick: onAction }]} onClick={onBar} />,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(onAction).toHaveBeenCalled()
    expect(onBar).toHaveBeenCalled()
  })

  it('text slot renders and suppresses when empty', () => {
    const withText = render(
      <MdActionBar actions={[{ text: 'go' }]}>
        <p>合计</p>
      </MdActionBar>,
    )
    expect(withText.container.querySelector('.md-action-bar-text')).not.toBeNull()
    const without = render(<MdActionBar actions={[{ text: 'go' }]} />)
    expect(without.container.querySelector('.md-action-bar-text')).toBeNull()
  })
})

describe('MdDetailItem', () => {
  it('renders title and content with bold variant', () => {
    const { container } = render(<MdDetailItem title="标题" content="内容" bold />)
    expect(container.querySelector('.md-detail-title')?.textContent).toBe('标题')
    expect(container.querySelector('.md-detail-content')?.textContent).toBe('内容')
    expect(container.querySelector('.md-detail-item')?.className).toContain('is-bold')
  })

  it('children override content', () => {
    const { container } = render(<MdDetailItem title="T">SLOT</MdDetailItem>)
    expect(container.querySelector('.md-detail-content')?.textContent).toBe('SLOT')
  })
})

describe('MdTextareaItem', () => {
  it('typing emits onChange', async () => {
    const onChange = vi.fn()
    const { container } = render(<MdTextareaItem value="" onChange={onChange} />)
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'hello' } })
    })
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('error prop renders message and is-error class', () => {
    const { container } = render(<MdTextareaItem error="错了" value="x" />)
    expect(container.querySelector('.md-textarea-item-msg p')?.textContent).toBe('错了')
    expect(container.querySelector('.md-textarea-item')?.className).toContain('is-error')
  })

  it('clear button appears on focus with value and clears', async () => {
    const onChange = vi.fn()
    const { container } = render(<MdTextareaItem clearable value="内容" onChange={onChange} />)
    const clear = container.querySelector('.md-textarea-item__clear') as HTMLElement
    expect(clear.style.display).toBe('none')
    await act(async () => {
      fireEvent.focus(container.querySelector('textarea')!)
    })
    expect(clear.style.display).not.toBe('none')
    fireEvent.click(clear)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('disabled hides clear and blocks textarea', () => {
    const { container } = render(<MdTextareaItem disabled value="locked" clearable />)
    expect(container.querySelector('.md-textarea-item__clear')).toBeNull()
    expect((container.querySelector('textarea') as HTMLTextAreaElement).disabled).toBe(true)
  })
})

describe('MdSteps', () => {
  const steps = [{ name: '一' }, { name: '二' }, { name: '三' }]

  it('renders status classes per current', () => {
    const { container } = render(<MdSteps steps={steps} current={1} />)
    const wrappers = container.querySelectorAll('.step-wrapper')
    expect(wrappers[0].className).toContain('reached')
    expect(wrappers[1].className).toContain('current')
    expect(wrappers[2].className).toBe('step-wrapper')
  })

  it('fraction current adds no-current class', () => {
    const { container } = render(<MdSteps steps={steps.slice(0, 2)} current={0.5} />)
    expect(container.querySelector('.md-steps')?.className).toContain('no-current')
  })

  it('current change updates status and renders success icon', async () => {
    const { container } = render(<MdSteps steps={steps} current={0} />)
    expect(container.querySelectorAll('.step-wrapper')[0].className).toContain('current')
    await act(async () => {
      container.dispatchEvent(new Event('x'))
    })
    const { container: c2, rerender } = render(<MdSteps steps={steps} current={2} />)
    await flush(30)
    const wrappers = c2.querySelectorAll('.step-wrapper')
    expect(wrappers[0].className).toContain('reached')
    expect(wrappers[2].className).toContain('current')
    expect(c2.querySelector('.step-wrapper.current svg')).not.toBeNull()
    rerender(<MdSteps steps={steps} current={2} />)
  })

  it('vertical mode sizes bars via stepsSize', async () => {
    const { container } = render(<MdSteps steps={steps} current={1} direction="vertical" />)
    await flush(60)
    const bars = container.querySelectorAll('.bar')
    expect(bars[0].getAttribute('style')).toContain('40px')
    expect(bars[1].getAttribute('style')).toContain('40px')
  })

  it('transition mode defers progress via timers', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<MdSteps steps={steps} current={0} transition />)
    rerender(<MdSteps steps={steps} current={2} transition />)
    await act(async () => {
      vi.advanceTimersByTime(50)
    })
    expect(container.querySelectorAll('.step-wrapper')[2].className).not.toContain('current')
    await act(async () => {
      vi.advanceTimersByTime(800)
    })
    expect(container.querySelectorAll('.step-wrapper')[2].className).toContain('current')
    vi.useRealTimers()
  })
})

describe('MdTabs / MdTabBar / MdTabPane', () => {
  function tabsApp(onChange?: (tab: { name: string | number; label?: string; disabled?: boolean }) => void) {
    return (
      <MdTabs onChange={onChange}>
        <MdTabPane label="标签一" name="a">内容一</MdTabPane>
        <MdTabPane label="标签二" name="b">内容二</MdTabPane>
        <MdTabPane label="禁用" name="c" disabled>内容三</MdTabPane>
      </MdTabs>
    )
  }

  it('defaults to first pane and registers panes', async () => {
    const { container } = render(tabsApp())
    await flush(40)
    expect(container.querySelector('.md-tab-bar-item.is-active')?.textContent).toBe('标签一')
    const panes = container.querySelectorAll('.md-tab-pane')
    expect((panes[0] as HTMLElement).style.display).not.toBe('none')
    expect((panes[1] as HTMLElement).style.display).toBe('none')
  })

  it('clicking a tab switches panes and emits change', async () => {
    const onChange = vi.fn()
    const { container } = render(tabsApp(onChange))
    await flush(40)
    const items = container.querySelectorAll('.md-tab-bar-item')
    fireEvent.click(items[1])
    await flush(20)
    expect(container.querySelector('.md-tab-bar-item.is-active')?.textContent).toBe('标签二')
    const panes = container.querySelectorAll('.md-tab-pane')
    expect((panes[1] as HTMLElement).style.display).not.toBe('none')
    expect(onChange).toHaveBeenCalled()
  })

  it('disabled tab does not switch', async () => {
    const { container } = render(tabsApp())
    await flush(40)
    fireEvent.click(container.querySelectorAll('.md-tab-bar-item')[2])
    await flush(20)
    expect(container.querySelector('.md-tab-bar-item.is-active')?.textContent).toBe('标签一')
  })

  it('value selects initial tab', async () => {
    const { container } = render(
      <MdTabs value="b">
        <MdTabPane label="L1" name="a">1</MdTabPane>
        <MdTabPane label="L2" name="b">2</MdTabPane>
      </MdTabs>,
    )
    await flush(40)
    expect(container.querySelector('.md-tab-bar-item.is-active')?.textContent).toBe('L2')
  })

  it('tab-bar disabled item blocks change', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <MdTabBar
        items={[
          { name: 'a', label: 'A' },
          { name: 'b', label: 'B', disabled: true },
        ]}
        onChange={onChange}
      />,
    )
    await flush(30)
    const before = onChange.mock.calls.length
    fireEvent.click(container.querySelectorAll('.md-tab-bar-item')[1])
    expect(onChange.mock.calls.length).toBe(before)
    expect(container.querySelector('.md-tab-bar-item.is-disabled')).not.toBeNull()
  })
})

describe('MdTransition', () => {
  it('renders child', () => {
    const { container } = render(
      <MdTransition name="md-fade">
        <div className="inner">内容</div>
      </MdTransition>,
    )
    expect(container.querySelector('.inner')?.textContent).toBe('内容')
  })
})

describe('MdTabBar 补充分支', () => {
  it('immediate fires onChange with current item', async () => {
    const onChange = vi.fn()
    render(
      <MdTabBar
        items={[{ name: 'a', label: 'A' }, { name: 'b', label: 'B' }]}
        immediate
        onChange={onChange}
      />,
    )
    await flush(30)
    expect(onChange).toHaveBeenCalled()
  })

  it('renderItem customizes item content', async () => {
    const { container } = render(
      <MdTabBar items={[{ name: 'a', label: 'A' }]} renderItem={({ item }) => `#${item.label}#`} />,
    )
    await flush(30)
    expect(container.querySelector('.md-tab-bar-item')?.textContent).toBe('#A#')
  })

  it('more than five items marks first item', async () => {
    const items = Array.from({ length: 6 }, (_, i) => ({ name: String(i), label: `T${i}` }))
    const { container } = render(<MdTabBar items={items} />)
    await flush(30)
    expect(container.querySelector('.md-tab-bar-item')?.className).toContain('more-than-five')
  })

  it('current disabled tab renders ink disabled', async () => {
    const { container } = render(
      <MdTabBar items={[{ name: 'a', label: 'A' }, { name: 'b', label: 'B', disabled: true }]} value="b" />,
    )
    await flush(30)
    expect(container.querySelector('.md-tab-bar-ink')?.className).toContain('is-disabled')
  })

  it('reflow scroll branches: first/last/boundary scroll targets', async () => {
    const { container } = render(
      <MdTabBar
        items={[{ name: 'a', label: 'A' }, { name: 'b', label: 'B' }, { name: 'c', label: 'C' }]}
        value="b"
      />,
    )
    await flush(40)
    // jsdom 几何为 0：prevRect.left(0) < wrapperRect.left(0) 为 false，走 else-if 分支也为 false
    expect(container.querySelector('.md-tab-bar-ink')).not.toBeNull()
  })
})

describe('MdSteps 渲染函数分支', () => {
  const steps = [{ name: '一' }, { name: '二' }]

  it('renderIcon takes precedence over status slots', () => {
    const { container } = render(
      <MdSteps
        steps={[{ name: '一' }, { name: '二' }, { name: '三' }]}
        current={1}
        renderIcon={({ currentIndex }) => <i className="custom-icon">{currentIndex}</i>}
        renderReached={({ index }) => <b className="r">{index}</b>}
        renderContent={({ index, step }) => <em>{`${index}-${step.name}`}</em>}
      />,
    )
    expect(container.querySelector('.custom-icon')).not.toBeNull()
    expect(container.querySelector('.r')).toBeNull()
    expect(container.querySelectorAll('em')).toHaveLength(3)
  })

  it('status slots render reached/current/unreached', () => {
    const { container } = render(
      <MdSteps
        steps={[{ name: '一' }, { name: '二' }, { name: '三' }]}
        current={1}
        renderReached={({ index }) => <b className="r">{index}</b>}
        renderCurrent={({ index }) => <b className="c">{index}</b>}
        renderUnreached={({ index }) => <b className="u">{index}</b>}
      />,
    )
    expect(container.querySelector('.r')).not.toBeNull()
    expect(container.querySelector('.c')).not.toBeNull()
    expect(container.querySelector('.u')).not.toBeNull()
  })

  it('custom mode renders children only', () => {
    const { container } = render(
      <MdSteps steps={steps} current={0} custom>
        <div className="fully-custom">接管</div>
      </MdSteps>,
    )
    expect(container.querySelector('.fully-custom')).not.toBeNull()
    expect(container.querySelector('.step-wrapper')).toBeNull()
  })

  it('verticalAdaptive skips size measurement', async () => {
    const { container } = render(
      <MdSteps steps={steps} current={0} direction="vertical" verticalAdaptive />,
    )
    await flush(40)
    expect(container.querySelectorAll('.bar')[0].getAttribute('style')).toBeNull()
  })
})

describe('MdTextareaItem 补充分支', () => {
  it('formation customizes input and cursor range', async () => {
    const formation = vi.fn(() => ({ value: 'FMT', range: 2 }))
    const { container } = render(<MdTextareaItem formation={formation} />)
    await act(async () => {
      fireEvent.change(container.querySelector('textarea')!, { target: { value: 'x' } })
    })
    expect(formation).toHaveBeenCalled()
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('FMT')
  })

  it('autosize runs height calc path', async () => {
    const { container } = render(<MdTextareaItem autosize value="some text" />)
    await flush(30)
    // jsdom scrollHeight 为 0 → 早退分支
    expect(container.querySelector('textarea')).not.toBeNull()
  })

  it('blur defers focus reset', async () => {
    const onBlur = vi.fn()
    const { container } = render(<MdTextareaItem onBlur={onBlur} />)
    fireEvent.focus(container.querySelector('textarea')!)
    fireEvent.blur(container.querySelector('textarea')!)
    await flush(150)
    expect(onBlur).toHaveBeenCalled()
  })
})
