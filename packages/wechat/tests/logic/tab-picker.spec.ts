/**
 * tab-picker 纯逻辑测试：面板树展开（panes）、选项单元格视图、选中路径截断。
 * 对照 Vue 版 TabPicker.vue 的 panes computed 与 onSelectPaneItem。
 */
import {describe, it, expect} from 'vitest'
import {buildPaneCells, buildPanes, spliceSelected, type TabPickerNode} from '../../src/components/tab-picker/logic'

const tree: TabPickerNode = {
  name: 'level0',
  label: '省份',
  options: [
    {value: 'zj', label: '浙江', children: {name: 'city', label: '城市', options: [{value: 'hz', label: '杭州'}, {value: 'nb', label: '宁波'}]}},
    {value: 'js', label: '江苏', children: {name: 'city', options: [{value: 'nj', label: '南京'}]}},
  ],
}

describe('tab-picker/logic buildPanes', () => {
  it('未选择时仅一层，label 取节点 label', () => {
    const panes = buildPanes(tree, [], '请选择')
    expect(panes).toHaveLength(1)
    expect(panes[0].name).toBe('level0')
    expect(panes[0].label).toBe('省份')
    expect(panes[0].value).toBeUndefined()
    expect(panes[0].selected).toBeUndefined()
  })

  it('选中值推进面板链：label 被选中项 label 覆盖', () => {
    const panes = buildPanes(tree, ['zj'], '请选择')
    expect(panes).toHaveLength(2)
    expect(panes[0].label).toBe('浙江')
    expect(panes[0].selected?.value).toBe('zj')
    expect(panes[1].name).toBe('city')
    expect(panes[1].label).toBe('城市')
  })

  it('叶子未选中：链条终止于叶子面板', () => {
    const panes = buildPanes(tree, ['zj', 'nb'], '请选择')
    expect(panes).toHaveLength(2) // 宁波无 children
    expect(panes[1].value).toBe('nb')
    expect(panes[1].selected?.label).toBe('宁波')
  })

  it('占位符：无 label 的未选中层用 placeholder', () => {
    // 'js' 选中但其子层未选中 → 子层面板 label = placeholder
    const panes = buildPanes(tree, ['js'], '请选择')
    expect(panes).toHaveLength(2)
    expect(panes[1].label).toBe('请选择')
    // 已选中项 label 覆盖
    expect(buildPanes(tree, ['zj', 'nb'], '请选择')[1].label).toBe('宁波')
  })

  it('空 data / 无 name 节点 → 空面板', () => {
    expect(buildPanes(undefined, [], '请选择')).toEqual([])
    expect(buildPanes({}, ['a'], '请选择')).toEqual([])
  })
})

describe('tab-picker/logic buildPaneCells', () => {
  it('选中态按 pane.value 命中；title 取 label ?? value', () => {
    const panes = buildPanes(tree, ['zj'], '请选择')
    const cells = buildPaneCells(panes[0])
    expect(cells).toHaveLength(2)
    expect(cells[0]).toMatchObject({title: '浙江', selected: true, disabled: false})
    expect(cells[1]).toMatchObject({title: '江苏', selected: false})
  })

  it('空面板 → 空单元格', () => {
    expect(buildPaneCells(undefined)).toEqual([])
  })
})

describe('tab-picker/logic spliceSelected', () => {
  it('截断写入：index 后全部丢弃', () => {
    expect(spliceSelected(['zj', 'hz', 'x'], 1, 'nb')).toEqual(['zj', 'nb'])
  })

  it('不修改原数组', () => {
    const src = ['a', 'b']
    const out = spliceSelected(src, 0, 'c')
    expect(src).toEqual(['a', 'b'])
    expect(out).toEqual(['c'])
  })
})
