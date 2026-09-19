/**
 * M6-6 行为测试：Chart/ImageReader/LicensePlate/Cashier/RollerSuccess
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import {
  MdCashier,
  MdChart,
  MdImageReader,
  MdLicensePlate,
  MdRollerSuccess,
} from '../../src'

async function settle(ms = 60) {
  await new Promise(r => setTimeout(r, ms))
}

describe('MdChart', () => {
  const labels = ['一', '二', '三']
  const datasets = [{ color: '#5b8ff9', values: [10, 20, 30] }]

  it('renders svg with axis ticks and paths', () => {
    const w = mount(MdChart, {
      props: { labels, datasets, size: [300, 200], max: 30, min: 0, lines: 3, step: 10 },
    })
    expect(w.find('svg.md-chart').exists()).toBe(true)
    // y 轴刻度（lines + 1）
    expect(w.findAll('.md-chart-axis-y g')).toHaveLength(4)
    // x 轴刻度
    expect(w.findAll('.md-chart-axis-x g')).toHaveLength(3)
    // 折线路径
    expect(w.find('.md-chart-path').exists()).toBe(true)
  })

  it('region theme renders area path', () => {
    const w = mount(MdChart, {
      props: {
        labels,
        datasets: [{ color: '#fa8919', theme: 'region', values: [10, 20, 30] }],
        size: [300, 200],
        max: 30,
        min: 0,
        lines: 3,
        step: 10,
      },
    })
    expect(w.find('.md-chart-path-area').exists()).toBe(true)
  })

  it('max/min default from datasets', () => {
    const w = mount(MdChart, { props: { labels, datasets: [{ values: [8, 250] }] } })
    // v2 推导：max 250 → ceil(2.5)*100 = 300；min 8 → 8；step = (300-8)/5 = 58.4
    const yLabels = w.findAll('.md-chart-axis-y text').map(t => t.text())
    expect(yLabels).toContain('300')
    expect(yLabels.at(-1)).toBe('8')
  })
})

describe('MdImageReader', () => {
  it('renders file input with mime', () => {
    const w = mount(MdImageReader, { props: { mime: ['png', 'jpeg'] } })
    const input = w.find('input[type=file]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('accept')).toBe('image/png,image/jpeg')
  })

  it('select emits files and amount overflow errors', async () => {
    const onSelect = vi.fn()
    const onError = vi.fn()
    const w = mount(MdImageReader, { props: { onSelect, onError, amount: 1 } })
    const input = w.find('input[type=file]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.png'), new File(['y'], 'b.png')],
      configurable: true,
    })
    await input.trigger('change')
    expect(onSelect).toHaveBeenCalled()
    expect(onError.mock.calls[0][1]).toEqual({ code: '103', msg: 'the number of pictures exceeds the limit' })
  })
})

describe('MdLicensePlate', () => {
  it('defaultValue fills key array', () => {
    const w = mount(MdLicensePlate, { props: { defaultValue: '浙AD12345' } })
    const items = w.findAll('.md-license-plate-input-item')
    expect(items).toHaveLength(8)
    expect(items[0].text()).toBe('浙')
    expect(items[3].text()).toBe('1')
  })

  it('keyboard hidden until input clicked; shortcut row first', async () => {
    const w = mount(MdLicensePlate, { props: { modeShow: 'division' } })
    expect(w.find('.md-license-plate-keyboard').exists()).toBe(false)
    await w.findAll('.md-license-plate-input-item')[0].trigger('click')
    await settle(40)
    // 第一位 → 省份键盘
    expect(w.find('.md-shortcut-row').exists()).toBe(true)
    await w.find('.md-shortcut-row-item').trigger('click')
    await settle(40)
    expect(w.findAll('.md-license-plate-input-item')[0].text()).toBe('京')
    // 选完省份后进入字母键盘（含 I/O 禁用 + 删除/确定功能键）
    expect(w.find('.md-mixed-key-board').exists()).toBe(true)
    const disabled = w.findAll('.md-mixed-key-board-item.disabled')
    expect(disabled.length).toBeGreaterThanOrEqual(2)
  })

  it('last-slot key press auto confirms with full plate', async () => {
    const onConfirm = vi.fn()
    const w = mount(MdLicensePlate, {
      props: { modeShow: 'division', defaultValue: '浙AD12345', onConfirm },
    })
    // 默认已填满 8 位；点击末位 → 键盘展开（数字可用）
    await w.findAll('.md-license-plate-input-item')[7].trigger('click')
    await settle(40)
    // 按下混合键盘第一个数字键 → 末位填 1 并自动确认
    const numKey = w.findAll('.md-mixed-key-board-item > div')[0]
    await numKey.trigger('click')
    await settle(40)
    expect(onConfirm).toHaveBeenCalled()
    expect(onConfirm.mock.calls.at(-1)![0]).toBe('浙AD12341')
  })

  it('popUp mode renders title bar', () => {
    const w = mount(MdLicensePlate, { props: { modeShow: 'popUp', showPopUp: true } })
    expect(w.find('.md-popup-title-bar').exists()).toBe(true)
  })
})

describe('MdRollerSuccess', () => {
  it('renders success check lines when isSuccess', () => {
    const w = mount(MdRollerSuccess, { props: { isSuccess: true } })
    expect(w.findAll('line')).toHaveLength(2)
  })
})

describe('MdCashier', () => {
  const channels = [
    { text: '招商银行储蓄卡', desc: '招商银行(1234)' },
    { text: '支付宝' },
  ]

  it('choose scene lists channels with pay button', async () => {
    const w = mount(MdCashier, {
      props: { modelValue: true, paymentAmount: '1000.00', channels },
    })
    await settle(80)
    expect(w.findAll('.md-cashier-channel-item')).toHaveLength(2)
    expect(w.find('.choose-number').text()).toBe('1000.00')
    expect(w.find('.md-cashier-pay-button').text()).toContain('确定支付')
  })

  it('channel select and pay events', async () => {
    const onSelect = vi.fn()
    const onPay = vi.fn()
    const w = mount(MdCashier, {
      props: { modelValue: true, channels, onSelect, onPay },
    })
    await settle(80)
    await w.findAll('.md-cashier-channel-item')[1].trigger('click')
    expect(onSelect.mock.calls[0][0].text).toBe('支付宝')
    await w.find('.md-cashier-pay-button').trigger('click')
    expect(onPay.mock.calls[0][0].text).toBe('支付宝')
  })

  it('next(scene) switches scene blocks', async () => {
    const w = mount(MdCashier, { props: { modelValue: true, channels } })
    await settle(80)
    ;(w.vm as unknown as { next: (s: 'success', o?: object) => void }).next('success', { text: '支付成功啦' })
    await settle(40)
    expect(w.find('.md-cashier-success').exists()).toBe(true)
    expect(w.find('.md-cashier-block-text').text()).toBe('支付成功啦')
  })
})
