/**
 * M6-3 行为测试：WaterMark/ResultPage/Ruler/Landscape
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { MdLandscape, MdResultPage, MdRuler, MdWaterMark } from '../../src'

async function settle(ms = 40) {
  await new Promise(r => setTimeout(r, ms))
}

describe('MdWaterMark', () => {
  it('tiles watermark slot with test-env repetition 2x2', () => {
    const w = mount(MdWaterMark, {
      slots: { default: '<p>内容</p>', watermark: '水印' },
    })
    expect(w.find('.water-mark-container p').text()).toBe('内容')
    expect(w.findAll('.water-mark-line')).toHaveLength(2)
    w.findAll('.water-mark-line').forEach((line) => {
      expect(line.findAll('.water-mark-item')).toHaveLength(2)
    })
  })

  it('repeatX/repeatY false render single row/col', () => {
    const w = mount(MdWaterMark, {
      props: { repeatX: false, repeatY: false },
      slots: { watermark: '水印' },
    })
    expect(w.findAll('.water-mark-line')).toHaveLength(1)
    expect(w.findAll('.water-mark-item')).toHaveLength(1)
  })

  it('rotate and opacity apply to wrapper', () => {
    const w = mount(MdWaterMark, {
      props: { rotate: -20, opacity: 0.2 },
      slots: { watermark: '水印' },
    })
    const style = w.find('.water-mark-list-wrapper').attributes('style')
    expect(style).toContain('rotate(-20deg)')
    expect(style).toContain('0.2')
  })

  it('content mode survives jsdom (canvas guard)', () => {
    const w = mount(MdWaterMark, { props: { content: '内部资料' } })
    expect(w.find('.water-mark-canvas').exists()).toBe(true)
    // jsdom 无 2d context，不应抛错
    expect(w.find('.water-mark-list').exists()).toBe(true)
  })
})

describe('MdResultPage', () => {
  it('empty type renders default image and text', () => {
    const w = mount(MdResultPage)
    expect(w.find('img').attributes('src')).toContain('empty.png')
    expect(w.find('.md-result-text').text()).toBe('暂无信息')
  })

  it('network/lost types render default texts', () => {
    expect(mount(MdResultPage, { props: { type: 'network' } }).find('.md-result-text').text()).toBe('网络连接异常')
    expect(mount(MdResultPage, { props: { type: 'lost' } }).find('.md-result-subtext').text()).toBe(
      '您要访问的页面已丢失',
    )
  })

  it('custom props override defaults', () => {
    const w = mount(MdResultPage, {
      props: { imgUrl: 'https://example.com/a.png', text: '标题', subtext: '描述' },
    })
    expect(w.find('img').attributes('src')).toBe('https://example.com/a.png')
    expect(w.find('.md-result-text').text()).toBe('标题')
    expect(w.find('.md-result-subtext').text()).toBe('描述')
  })

  it('buttons render and handle click', async () => {
    const handler = vi.fn()
    const w = mount(MdResultPage, {
      props: { buttons: [{ text: '刷新', handler }, { text: '返回' }] },
    })
    const buttons = w.findAll('button')
    expect(buttons).toHaveLength(2)
    await buttons[0].trigger('click')
    expect(handler).toHaveBeenCalled()
  })
})

describe('MdRuler', () => {
  it('renders canvas skeleton with cursor and arrow', () => {
    const w = mount(MdRuler, { props: { scope: [0, 100], unit: 10 } })
    expect(w.find('.md-ruler-canvas').exists()).toBe(true)
    expect(w.find('.md-ruler-cursor').exists()).toBe(true)
    expect(w.find('.md-ruler-arrow').exists()).toBe(true)
  })

  it('stepTextPosition bottom applies class', () => {
    const w = mount(MdRuler, { props: { stepTextPosition: 'bottom' } })
    expect(w.find('.md-ruler-cursor').classes()).toContain('md-ruler-cursor-bottom')
  })

  it('mounts safely in jsdom (canvas guard) and responds to value change', async () => {
    const w = mount(MdRuler, { props: { value: 50, scope: [0, 100], unit: 10 } })
    await settle(50)
    await w.setProps({ value: 60 })
    await settle(50)
    // 无 canvas 实现下不抛错即视为通过
    expect(w.find('.md-ruler').exists()).toBe(true)
  })
})

describe('MdLandscape', () => {
  it('closed by default, popup hidden', () => {
    const w = mount(MdLandscape, { slots: { default: '<p class="c">横屏内容</p>' } })
    expect(JSON.stringify(w.html())).toContain('display: none')
  })

  it('value opens popup and close icon closes', async () => {
    const w = mount(MdLandscape, {
      props: { modelValue: true },
      slots: { default: '<p class="c">横屏内容</p>' },
    })
    await settle(80)
    expect(JSON.stringify(w.html())).not.toContain('display: none')
    const close = w.find('.md-landscape-close')
    expect(close.exists()).toBe(true)
    await close.trigger('click')
    await settle(80)
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('fullScreen applies is-full and clear icon', async () => {
    const w = mount(MdLandscape, {
      props: { modelValue: true, fullScreen: true },
      slots: { default: '<p class="c">横屏内容</p>' },
    })
    await settle(80)
    expect(w.find('.md-landscape').classes()).toContain('is-full')
    // fullScreen 下 close 图标为 clear
    expect(w.html()).toContain('md-icon-clear')
  })
})
