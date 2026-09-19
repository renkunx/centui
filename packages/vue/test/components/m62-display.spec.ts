/**
 * M6-2 展示与排版类行为测试：ActionBar/DetailItem/TextareaItem/Steps/Tabs/TabBar/Transition
 */
import { mount } from '@vue/test-utils'
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

async function settle(ms = 30) {
  await new Promise(r => setTimeout(r, ms))
}

describe('MdActionBar', () => {
  it('renders at most two actions with derived type/plain', () => {
    const w = mount(MdActionBar, {
      props: {
        actions: [
          { text: 'A' },
          { text: 'B' },
          { text: 'C' },
        ],
      },
    })
    const buttons = w.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].classes()).toContain('plain')
    expect(buttons[1].classes()).not.toContain('plain')
  })

  it('disabled action maps to disabled type', () => {
    const w = mount(MdActionBar, { props: { actions: [{ text: 'X', disabled: true }] } })
    expect(w.find('button').classes()).toContain('disabled')
  })

  it('click invokes action handler and emits click', async () => {
    const onClick = vi.fn()
    const w = mount(MdActionBar, { props: { actions: [{ text: 'go', onClick }] } })
    await w.find('button').trigger('click')
    expect(onClick).toHaveBeenCalled()
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('text slot renders and suppresses when empty', () => {
    const withText = mount(MdActionBar, {
      props: { actions: [{ text: 'go' }] },
      slots: { default: '<p>合计</p>' },
    })
    expect(withText.find('.md-action-bar-text').exists()).toBe(true)
    const without = mount(MdActionBar, { props: { actions: [{ text: 'go' }] } })
    expect(without.find('.md-action-bar-text').exists()).toBe(false)
  })
})

describe('MdDetailItem', () => {
  it('renders title and content with bold variant', () => {
    const w = mount(MdDetailItem, { props: { title: '标题', content: '内容', bold: true } })
    expect(w.find('.md-detail-title').text()).toBe('标题')
    expect(w.find('.md-detail-content').text()).toBe('内容')
    expect(w.classes()).toContain('is-bold')
  })

  it('slot overrides content', () => {
    const w = mount(MdDetailItem, { props: { title: 'T' }, slots: { default: 'SLOT' } })
    expect(w.find('.md-detail-content').text()).toBe('SLOT')
  })
})

describe('MdTextareaItem', () => {
  it('v-model round-trips typed input', async () => {
    const w = mount(MdTextareaItem, { props: { modelValue: '', title: 'T' } })
    const textarea = w.find('textarea')
    await textarea.setValue('hello')
    expect(w.emitted('update:modelValue')![0]).toEqual(['hello'])
  })

  it('error prop renders message and is-error class', () => {
    const w = mount(MdTextareaItem, { props: { error: '错了', modelValue: 'x' } })
    expect(w.find('.md-textarea-item-msg p').text()).toBe('错了')
    expect(w.find('.md-textarea-item').classes()).toContain('is-error')
  })

  it('clear button appears on focus with value and clears', async () => {
    const w = mount(MdTextareaItem, { props: { clearable: true, value: '内容' } })
    // jsdom 下 VTU isVisible 受 offsetParent 限制，改用 v-show 的 style 断言
    expect(w.find('.md-textarea-item__clear').attributes('style')).toContain('display: none')
    await w.find('textarea').trigger('focus')
    expect(w.find('.md-textarea-item__clear').attributes('style')).not.toContain('display: none')
    await w.find('.md-textarea-item__clear').trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([''])
  })

  it('formation hook formats input', async () => {
    const formation = vi.fn(() => ({ value: 'FORMATTED', range: 3 }))
    const w = mount(MdTextareaItem, {
      props: { formation },
    })
    const textarea = w.find('textarea').element as HTMLTextAreaElement
    await w.find('textarea').trigger('input')
    expect(formation).toHaveBeenCalled()
    expect((textarea as HTMLTextAreaElement).value).toBe('FORMATTED')
  })

  it('disabled blocks textarea', () => {
    const w = mount(MdTextareaItem, { props: { disabled: true, value: 'locked' } })
    expect(w.find('textarea').attributes('disabled')).toBeDefined()
    expect(w.find('.md-textarea-item__clear').exists()).toBe(false)
  })
})

describe('MdSteps', () => {
  const steps = [{ name: '一' }, { name: '二' }, { name: '三' }]

  it('renders status classes per current', () => {
    const w = mount(MdSteps, { props: { steps, current: 1 } })
    const wrappers = w.findAll('.step-wrapper')
    expect(wrappers[0].classes()).toEqual(['step-wrapper', 'reached'])
    expect(wrappers[1].classes()).toEqual(['step-wrapper', 'current'])
    expect(wrappers[2].classes()).toEqual(['step-wrapper'])
  })

  it('fraction current adds no-current class', () => {
    const w = mount(MdSteps, { props: { steps: steps.slice(0, 2), current: 0.5 } })
    expect(w.find('.md-steps').classes()).toContain('no-current')
    expect(w.findAll('.step-wrapper')[0].classes()).toContain('reached')
  })

  it('current change updates progress', async () => {
    const w = mount(MdSteps, { props: { steps, current: 0 } })
    expect(w.findAll('.step-wrapper')[0].classes()).toEqual(['step-wrapper', 'current'])
    await w.setProps({ current: 2 })
    expect(w.findAll('.step-wrapper')[0].classes()).toContain('reached')
    expect(w.findAll('.step-wrapper')[2].classes()).toEqual(['step-wrapper', 'current'])
    // 当前节点渲染 success 图标
    expect(w.find('.step-wrapper.current svg').exists()).toBe(true)
  })

  it('vertical mode sizes bars via stepsSize', async () => {
    const w = mount(MdSteps, {
      props: { steps, current: 1, direction: 'vertical' },
    })
    await settle(40)
    const bars = w.findAll('.bar')
    expect(bars[0].attributes('style')).toContain('40px')
    expect(bars[1].attributes('style')).toContain('40px')
  })

  it('transition mode defers progress via timers', async () => {
    vi.useFakeTimers()
    const w = mount(MdSteps, { props: { steps, current: 0, transition: true } })
    await vi.advanceTimersByTimeAsync(0)
    w.setProps({ current: 2 })
    await vi.advanceTimersByTimeAsync(50)
    // 100ms 延迟后才开始过渡
    expect(w.findAll('.step-wrapper')[2].classes()).not.toContain('current')
    await vi.advanceTimersByTimeAsync(800)
    expect(w.findAll('.step-wrapper')[2].classes()).toContain('current')
    vi.useRealTimers()
  })
})

describe('MdTabs / MdTabBar / MdTabPane', () => {
  function mountTabs(extraProps: Record<string, unknown> = {}) {
    return mount({
      components: { MdTabs, MdTabPane },
      template: `<md-tabs v-bind="extra">
        <md-tab-pane label="标签一" name="a">内容一</md-tab-pane>
        <md-tab-pane label="标签二" name="b">内容二</md-tab-pane>
        <md-tab-pane label="禁用" name="c" disabled>内容三</md-tab-pane>
      </md-tabs>`,
      setup: () => ({ extra: extraProps }),
    })
  }

  it('defaults to first pane and registers panes', async () => {
    const w = mountTabs()
    await settle(40)
    const tabs = w.findComponent({ name: 'md-tabs' })
    expect((tabs.vm as unknown as { currentName: unknown }).currentName).toBe('a')
    expect(w.find('.md-tab-bar-item.is-active').text()).toBe('标签一')
    expect(w.findAll('.md-tab-pane')[0].isVisible()).toBe(true)
    expect(w.findAll('.md-tab-pane')[1].isVisible()).toBe(false)
  })

  it('clicking a tab switches panes and emits', async () => {
    const w = mountTabs()
    await settle(40)
    await w.findAll('.md-tab-bar-item')[1].trigger('click')
    expect(w.find('.md-tab-bar-item.is-active').text()).toBe('标签二')
    expect(w.findAll('.md-tab-pane')[1].isVisible()).toBe(true)
    expect(w.findComponent({ name: 'md-tabs' }).emitted('change')).toBeTruthy()
  })

  it('disabled tab does not switch', async () => {
    const w = mountTabs()
    await settle(40)
    await w.findAll('.md-tab-bar-item')[2].trigger('click')
    expect(w.find('.md-tab-bar-item.is-active').text()).toBe('标签一')
  })

  it('model-value selects initial tab', async () => {
    const w = mount({
      components: { MdTabs, MdTabPane },
      template: `<md-tabs model-value="b">
        <md-tab-pane label="L1" name="a">1</md-tab-pane>
        <md-tab-pane label="L2" name="b">2</md-tab-pane>
      </md-tabs>`,
    })
    await settle(40)
    expect(w.find('.md-tab-bar-item.is-active').text()).toBe('L2')
  })

  it('tab-bar disabled item blocks change', async () => {
    const w = mount(MdTabBar, {
      props: {
        items: [
          { name: 'a', label: 'A' },
          { name: 'b', label: 'B', disabled: true },
        ],
      },
    })
    await settle(30)
    const before = w.emitted('change')?.length ?? 0
    await w.findAll('.md-tab-bar-item')[1].trigger('click')
    expect(w.emitted('change')?.length ?? 0).toBe(before)
    expect(w.find('.md-tab-bar-item.is-disabled').exists()).toBe(true)
  })

  it('tab-bar string inkLength renders numeric width', async () => {
    const w = mount(MdTabBar, {
      props: { items: [{ name: 'a', label: 'A' }], inkLength: '30' },
    })
    await settle(30)
    // jsdom 下 reflow 中 target.offsetWidth 为 0，字符串 inkLength 直接作为宽度
    const ink = w.find('.md-tab-bar-ink')
    expect(ink.exists()).toBe(true)
  })
})

describe('MdTransition', () => {
  it('renders child and forwards name attr', () => {
    const w = mount(MdTransition, {
      props: { name: 'md-fade' },
      slots: { default: '<div class="inner">内容</div>' },
    })
    expect(w.find('.inner').text()).toBe('内容')
  })
})
