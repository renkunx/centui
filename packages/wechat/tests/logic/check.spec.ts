/**
 * check / check-group 纯逻辑测试：check/uncheck/toggle/toggleAll 与 max 语义，
 * 逐一对照 Vue 版 CheckGroup.vue 与 check/shared.ts useCheckDelegate。
 */
import {describe, it, expect} from 'vitest'
import {
  checkName,
  isCheckChecked,
  nextCheckValue,
  toggleAllValues,
  toggleName,
  uncheckName,
} from '../../src/components/check/logic'

describe('check/logic useCheckDelegate', () => {
  it('选中态：自身 v-model 命中或组值包含 name', () => {
    expect(isCheckChecked('a', 'a', [])).toBe(true)
    expect(isCheckChecked(false, 'a', ['a'])).toBe(true)
    expect(isCheckChecked(false, 'a', ['b'])).toBe(false)
    expect(isCheckChecked(true, true, [])).toBe(true)
  })

  it('布尔名：点击取反（独立 checkbox 语义）', () => {
    expect(nextCheckValue(true, false, false)).toBe(true)
    expect(nextCheckValue(true, true, true)).toBe(false)
  })

  it('非布尔名：已选反选为 \'\'，未选上报 name', () => {
    expect(nextCheckValue('a', 'a', true)).toBe('')
    expect(nextCheckValue('a', false, false)).toBe('a')
  })
})

describe('check-group/logic check / uncheck / toggle', () => {
  it('check：未选中时追加', () => {
    expect(checkName([], 'a', 0)).toEqual(['a'])
    expect(checkName(['a'], 'b', 0)).toEqual(['a', 'b'])
  })

  it('check：max < 1 不限；达到 max 不再追加（返回原数组引用，不 emit）', () => {
    const value = ['a', 'b']
    expect(checkName(value, 'c', 2)).toBe(value)
    expect(checkName(value, 'c', 3)).toEqual(['a', 'b', 'c'])
  })

  it('uncheck：移除指定项，未选中返回原引用', () => {
    expect(uncheckName(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
    const value = ['a']
    expect(uncheckName(value, 'b')).toBe(value)
  })

  it('toggle：按当前选中态取反', () => {
    expect(toggleName(['a'], 'b', 0)).toEqual(['a', 'b'])
    expect(toggleName(['a', 'b'], 'a', 0)).toEqual(['b'])
  })
})

describe('check-group/logic toggleAll（对齐 Vue defineExpose.toggleAll）', () => {
  const children = [
    {name: 'a'},
    {name: 'b', disabled: true},
    {name: 1},
    {name: true}, // 登记表语义：name 为 true/'' 的子项不参与
    {name: ''},
  ]

  it('全选：disabled 项不参与，name 以 Object.keys 键形态字符串化（Vue 历史语义）', () => {
    expect(toggleAllValues(children, [], true)).toEqual(['a', '1'])
  })

  it('全清（checked === false）', () => {
    expect(toggleAllValues(children, ['a', 1], false)).toEqual([])
  })

  it('缺省取反：disabled 项保持原状', () => {
    // a 选中→取消；b disabled 未选中→保持未选中；1 未选中→选中
    expect(toggleAllValues(children, ['a'], undefined)).toEqual(['1'])
  })

  it('disabled 已选中的项在全选/取反时保留；未选中的 disabled 项在取反时被点亮', () => {
    // b disabled 且已选中：任何 checked 语义下保持
    expect(toggleAllValues(children, ['b'], true)).toEqual(['a', 'b', '1'])
    // 取反：a 未选中→点亮；b disabled 保持已选；1 未选中→点亮
    expect(toggleAllValues(children, ['b'], undefined)).toEqual(['a', 'b', '1'])
  })

  it('空 children 返回空数组', () => {
    expect(toggleAllValues([], ['a'], true)).toEqual([])
  })
})
