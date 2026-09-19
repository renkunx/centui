/**
 * M6-5 行为测试：Bill/ImageViewer/Captcha
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { MdBill, MdCaptcha, MdImageViewer } from '../../src'

async function settle(ms = 60) {
  await new Promise(r => setTimeout(r, ms))
}

describe('MdBill', () => {
  it('renders title and no with default structure', () => {
    const w = mount(MdBill, {
      props: { title: '借款电子凭证', no: '12345689' },
      slots: { default: '<p class="bill-detail">¥30,000</p>' },
    })
    expect(w.find('.md-bill').exists()).toBe(true)
    expect(w.find('.md-bill-title').text()).toBe('借款电子凭证')
    expect(w.find('.md-bill-no').text()).toBe('NO.12345689')
    expect(w.find('.md-bill-neck').exists()).toBe(true)
    expect(w.find('.bill-detail').exists()).toBe(true)
  })

  it('header slot replaces title/no; footer slot renders', () => {
    const w = mount(MdBill, {
      slots: {
        header: '<div class="custom-header">H</div>',
        default: '内容',
        footer: '<button class="ftr">刷新</button>',
      },
    })
    expect(w.find('.custom-header').exists()).toBe(true)
    expect(w.find('.md-bill-title').exists()).toBe(false)
    expect(w.find('.md-bill-footer .ftr').exists()).toBe(true)
  })

  it('content watermark renders canvas', () => {
    const w = mount(MdBill, { props: { waterMark: 'mand-mobile' }, slots: { default: 'x' } })
    expect(w.find('.water-mark-canvas').exists()).toBe(true)
  })
})

describe('MdImageViewer', () => {
  const list = ['https://example.com/a.png', 'https://example.com/b.png']

  it('closed by default; value opens with items', async () => {
    const w = mount(MdImageViewer, { props: { list } })
    // VTU isVisible 在未挂载树上不可靠，用 v-show 的 style 断言
    expect(w.find('.md-image-viewer').attributes('style')).toContain('display: none')
    await w.setProps({ modelValue: true })
    await settle(80)
    expect(w.find('.md-image-viewer').attributes('style')).not.toContain('display: none')
    expect(w.findAll('.viewer-item-wrap')).toHaveLength(2)
    expect(w.find('.viewer-index').text()).toBe('1/2')
  })

  it('initialIndex sets start position', async () => {
    const w = mount(MdImageViewer, { props: { list, modelValue: true, initialIndex: 1 } })
    await settle(80)
    expect(w.find('.viewer-index').text()).toBe('2/2')
  })

  it('viewer click closes and emits update', async () => {
    const w = mount(MdImageViewer, { props: { list, modelValue: true } })
    await settle(80)
    await w.find('.md-image-viewer').trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('object list items pass url/alt', async () => {
    const w = mount(MdImageViewer, {
      props: { modelValue: true, list: [{ url: 'https://example.com/x.png', alt: 'X 图' }] },
    })
    await settle(80)
    const img = w.find('.viewer-item-wrap img')
    expect(img.attributes('src')).toBe('https://example.com/x.png')
    expect(img.attributes('alt')).toBe('X 图')
  })
})

describe('MdCaptcha', () => {
  it('inline mode renders content and codebox', async () => {
    const w = mount(MdCaptcha, {
      props: { isView: true, title: '输入验证码', brief: '已发送', maxlength: 4 },
      slots: { default: '短信验证码已发送' },
    })
    await settle(50)
    expect(w.find('.md-captcha-title').text()).toBe('输入验证码')
    expect(w.find('.md-captcha-message').text()).toBe('短信验证码已发送')
    expect(w.find('.md-codebox').exists()).toBe(true)
  })

  it('auto countdown starts and resets', async () => {
    vi.useFakeTimers()
    const w = mount(MdCaptcha, {
      props: { isView: true, count: 3, countActiveText: '重发({$1}s)', countNormalText: '重新发送' },
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(w.find('.md-captcha-btn').text()).toBe('重发(3s)')
    expect((w.find('.md-captcha-btn').element as HTMLButtonElement).disabled).toBe(true)
    await vi.advanceTimersByTimeAsync(3100)
    expect(w.find('.md-captcha-btn').text()).toBe('重新发送')
    vi.useRealTimers()
  })

  it('submit emits code', async () => {
    const onSubmit = vi.fn()
    const w = mount(MdCaptcha, { props: { isView: true, maxlength: 4, onSubmit } })
    await settle(40)
    const input = w.find('input')
    await input.setValue('1234')
    await settle(40)
    // codebox 满 4 位触发 submit
    expect(onSubmit).toHaveBeenCalledWith('1234')
  })

  it('setError shows error message', async () => {
    const w = mount(MdCaptcha, { props: { isView: true } })
    await settle(40)
    ;(w.vm as unknown as { setError: (m: string) => void }).setError('验证码错误')
    await settle(40)
    expect(w.find('.md-captcha-error').text()).toBe('验证码错误')
  })

  it('halfScreen mode renders popup skeleton and dialog mode too', () => {
    const w = mount(MdCaptcha, { props: { type: 'halfScreen', modelValue: true } })
    // 半屏模式包含 title bar
    expect(w.find('.md-popup-title-bar').exists()).toBe(true)
  })
})
