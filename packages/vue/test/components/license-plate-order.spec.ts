/**
 * CuLicensePlate 顺序填写（disorderClick）规则契约测试。
 *
 * 背景：v2（mand-mobile）没有 license-plate 组件，该组件为 v3 新增，
 * 无 v2 基线可对照；本 spec 将评审确认的「顺序填写」规则固化为行为契约：
 *
 * 1. disorderClick=true（默认）：任意键位可点击（无序点击放行）
 * 2. disorderClick=false：锁定顺序填写——仅"已填写的相邻前一位"或"第 0 位"可选中，
 *    点击不满足条件的空位不切换选中位（键盘输入落点不变）
 * 3. onEnter 写入当前选中位并推进；写满最后一位自动 confirm
 * 4. onDelete 清空当前位并回退；第 0 位删除时 division 模式收起键盘
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CuLicensePlate from '../../src/components/license-plate/LicensePlate.vue'

const findBoxes = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('.cu-license-plate-input .cu-license-plate-input-item')

describe('CuLicensePlate 顺序填写规则（disorderClick）', () => {
  it('disorderClick=true（默认）允许无序点击任意键位', async () => {
    const wrapper = mount(CuLicensePlate, { props: { disorderClick: true } })
    const boxes = findBoxes(wrapper)
    expect(boxes).toHaveLength(8)

    // 直接跳到第 3 位也应放行（无序点击）
    await boxes[3]!.trigger('click')
    expect(boxes[3]!.classes()).toContain('active')
  })

  it('disorderClick=false 时点击"前一位未填"的中间位不切换选中位', async () => {
    const wrapper = mount(CuLicensePlate, { props: { disorderClick: false } })
    const boxes = findBoxes(wrapper)

    // 第 0 位放行；再点第 2 位（第 1 位未填）应被拦截
    await boxes[0]!.trigger('click')
    await boxes[2]!.trigger('click')
    expect(boxes[0]!.classes()).toContain('active')
    expect(boxes[2]!.classes()).not.toContain('active')
  })

  it('disorderClick=false 时"前一位已填"的键位可顺序推进', async () => {
    const wrapper = mount(CuLicensePlate, {
      props: { disorderClick: false, defaultValue: '京A' },
    })
    const boxes = findBoxes(wrapper)
    // 前 2 位已填，第 2 位（相邻前一位已填）可选中
    await boxes[2]!.trigger('click')
    expect(boxes[2]!.classes()).toContain('active')
  })

  it('onEnter 写入并推进，写满最后一位自动 confirm', async () => {
    const wrapper = mount(CuLicensePlate, { props: { disorderClick: true } })
    const boxes = findBoxes(wrapper)
    await boxes[0]!.trigger('click')

    // 省份键盘输入第 1 位 → 混合键盘出现；随后逐位输入至写满
    const shortcut = wrapper.find('.cu-shortcut-row-item')
    await shortcut!.trigger('click')
    for (let i = 0; i < 7; i++) {
      const letterKey = wrapper.find(
        '.cu-mixed-key-board-item:not([class*="disabled"]) div:not([class*="delete"]):not([class*="confirm"])',
      )
      await letterKey!.trigger('click')
    }
    const emitted = wrapper.emitted('confirm')
    expect(emitted).toHaveLength(1)
    expect(String(emitted![0]![0])).toContain('京')
  })

  it('onDelete 清空当前位并回退选中位（division 键盘随 selectedIndex 切换键盘面）', async () => {
    const wrapper = mount(CuLicensePlate, { props: { disorderClick: true } })
    const boxes = findBoxes(wrapper)
    await boxes[0]!.trigger('click')
    expect(wrapper.find('.cu-license-plate-keyboard-container').exists()).toBe(true)

    await wrapper.find('.cu-shortcut-row-item')!.trigger('click')
    // 输入省份后 selectedIndex=1，混合键盘（含删除键）出现
    expect(wrapper.find('.cu-license-plate-keyboard-container .delete').exists()).toBe(true)

    // 删除：清空第 1 位并回退到 selectedIndex=0，键盘面切回省份简写（无删除键）
    await wrapper.find('.cu-license-plate-keyboard-container .delete')!.trigger('click')
    expect(findBoxes(wrapper)[0]!.classes()).toContain('active')
    expect(wrapper.find('.cu-license-plate-keyboard-container .cu-shortcut-row').exists()).toBe(true)
    expect(wrapper.find('.cu-license-plate-keyboard-container .delete').exists()).toBe(false)
  })
})
