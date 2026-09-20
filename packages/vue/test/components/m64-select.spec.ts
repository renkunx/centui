/**
 * M6-4 行为测试：Selector/DropMenu/TabPicker
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { CuDropMenu, CuSelector, CuTabPicker } from '../../src'

async function settle(ms = 60) {
  await new Promise(r => setTimeout(r, ms))
}

describe('CuSelector', () => {
  const data = [
    { value: '1', text: '选项一' },
    { value: '2', text: '选项二' },
  ]

  it('closed by default', () => {
    const w = mount(CuSelector, { props: { data } })
    expect(JSON.stringify(w.html())).toContain('display: none')
  })

  it('modelValue opens popup; immediate choose closes and emits', async () => {
    const w = mount(CuSelector, { props: { data, modelValue: true } })
    await settle(80)
    expect(JSON.stringify(w.html())).not.toContain('display: none')
    // 点击第一项（无 okText → 立即选中关闭）
    const items = w.findAll('.cu-radio-item')
    await items[0].trigger('click')
    await settle(60)
    expect(w.emitted('choose')?.length).toBe(1)
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('okText requires confirm; confirm emits selected item', async () => {
    const w = mount(CuSelector, { props: { data, modelValue: true, okText: '确定' } })
    await settle(80)
    await w.findAll('.cu-radio-item')[1].trigger('click')
    expect(w.emitted('choose')?.length).toBe(1)
    expect(JSON.stringify(w.html())).not.toContain('display: none') // 仍打开
    await w.find('.cu-popup-title-bar .cu-popup-confirm').trigger('click')
    expect(w.emitted('confirm')?.length).toBe(1)
  })

  it('multi mode accumulates and confirm emits array', async () => {
    const w = mount(CuSelector, {
      props: { data, modelValue: true, multi: true, okText: '确定', defaultValue: ['1'] },
    })
    await settle(80)
    // 已默认勾选第一项；再勾选第二项
    await w.findAll('.cu-check-item')[1].trigger('click')
    await w.find('.cu-popup-title-bar .cu-popup-confirm').trigger('click')
    const confirmArgs = w.emitted('confirm')?.at(-1) as unknown as [string[]]
    expect(confirmArgs[0]).toEqual(['1', '2'])
  })

  it('cancel resets selection and emits cancel', async () => {
    const w = mount(CuSelector, {
      props: { data, modelValue: true, okText: '确定', cancelText: '取消' },
    })
    await settle(80)
    await w.findAll('.cu-radio-item')[1].trigger('click')
    await w.find('.cu-popup-title-bar .cu-popup-cancel').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })
})

describe('CuDropMenu', () => {
  const data = [
    { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }] },
    { text: '排序', options: [{ value: '3', text: '默认排序' }, { value: '4', text: '价格' }] },
    { text: '禁用项', disabled: true, options: [] },
  ]

  it('renders bar with default-selected text', async () => {
    const w = mount(CuDropMenu, { props: { data, defaultValue: ['2'] } })
    await settle(30)
    const items = w.findAll('.bar-item')
    expect(items[0].text()).toBe('数码')
    expect(items[0].classes()).toContain('selected')
    expect(items[2].classes()).toContain('disabled')
  })

  it('bar click opens popup, list click selects and closes', async () => {
    const onChange = vi.fn()
    const w = mount(CuDropMenu, { props: { data, onChange } })
    await settle(50)
    await w.findAll('.bar-item')[1].trigger('click')
    await settle(60)
    expect(w.find('.cu-popup-box').isVisible()).toBe(true)
    expect(w.findAll('.bar-item')[1].classes()).toContain('active')
    // 选中列表项
    await w.findAll('.cu-radio-item')[0].trigger('click')
    // Popup 的关闭过渡由 Popup 专项测试覆盖，这里断言选择契约
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls[0][0].text).toBe('排序')
    expect(onChange.mock.calls[0][1].text).toBe('默认排序')
    await settle(400)
    expect(w.findAll('.bar-item')[1].text()).toBe('默认排序')
  })

  it('disabled bar item blocks open', async () => {
    const w = mount(CuDropMenu, { props: { data } })
    await w.findAll('.bar-item')[2].trigger('click')
    await settle(40)
    expect(w.find('.cu-popup-box').isVisible()).toBe(false)
  })

  it('exposes selected values', async () => {
    const w = mount(CuDropMenu, { props: { data, defaultValue: ['', '4'] } })
    await settle(50)
    const vm = w.vm as unknown as { getSelectedValue: (i: number) => { text?: string } }
    expect(vm.getSelectedValue(1)?.text).toBe('价格')
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

  it('defaultValue derives panes and labels', async () => {
    const w = mount(CuTabPicker, {
      props: { data: cascadeData, defaultValue: ['zj', 'hz'] },
    })
    await settle(50)
    // 默认值下生成两级 pane
    expect(w.findAll('.cu-tab-pane')).toHaveLength(2)
  })

  it('select leaf emits change and closes', async () => {
    const onChange = vi.fn()
    const onSelect = vi.fn()
    const w = mount(CuTabPicker, {
      props: { data: cascadeData, modelValue: true, onChange, onSelect },
    })
    await settle(80)
    // 打开时只有一级 pane
    expect(w.findAll('.cu-tab-pane')).toHaveLength(1)
    // 选浙江 → 二级 pane 出现
    await w.findAll('.cu-radio-item')[0].trigger('click')
    await settle(80)
    expect(onSelect).toHaveBeenCalled()
    expect(w.findAll('.cu-tab-pane')).toHaveLength(2)
    // 选杭州 → 300ms 后 change + 关闭
    const panes = w.findAll('.cu-tab-pane')
    await panes[1].find('.cu-radio-item').trigger('click')
    await settle(500)
    expect(onChange).toHaveBeenCalledTimes(1)
    const payload = onChange.mock.calls[0][0] as { values: string[] }
    expect(payload.values).toEqual(['zj', 'hz'])
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })
})
