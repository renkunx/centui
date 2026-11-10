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

// ---------------------------------------------------------------------------
// tab-picker 组件实例（index.ts）：attached/observers/popup 桥接/取消恢复/
// tab 与选项交互/完整选择流/公开 API
// ---------------------------------------------------------------------------
import {beforeEach as b2, afterEach as a2, describe as d2, expect as e2, it as i2, vi} from 'vitest'
import {loadComponent, mountDef, tapEvent, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/tab-picker/index'))

b2(() => vi.useFakeTimers())
a2(() => vi.useRealTimers())

const TREE = {
  name: 'level0',
  label: '省份',
  options: [
    {value: 'zj', label: '浙江', children: {name: 'city', label: '城市', options: [{value: 'hz', label: '杭州'}, {value: 'nb', label: '宁波'}]}},
    {value: 'js', label: '江苏', children: {name: 'city', options: [{value: 'nj', label: '南京'}]}},
  ],
}

function stateOf(inst: Mounted) {
  return (inst as unknown as {__tabPicker: {oldSelected: unknown[]; oldCurrentTab: string; suppressChange: boolean; popup: unknown}}).__tabPicker
}

function tap(index: number) {
  return tapEvent({index}) as never
}

d2('tab-picker attached 与 observers', () => {
  i2('attached：无 defaultValue → 单层面板，currentTab 推进到末层面板', () => {
    const inst = mountDef(comp.def, {props: {data: TREE}})
    inst.attached()
    e2(inst.data.panes).toHaveLength(1)
    e2(inst.data.panes[0]).toMatchObject({name: 'level0', label: '省份'})
    e2(inst.data.cells).toEqual([
      {no: 0, title: '浙江', selected: false, disabled: false},
      {no: 1, title: '江苏', selected: false, disabled: false},
    ])
    e2(inst.data.currentTab).toBe('level0')
    e2(inst.data.currentIndex).toBe(0)
    e2(inst.data.pickerShow).toBe(false)
  })

  i2('attached：defaultValue 路径 → 多层面板', () => {
    const inst = mountDef(comp.def, {props: {data: TREE, defaultValue: ['zj']}})
    inst.attached()
    e2(inst.data.panes).toHaveLength(2)
    e2(inst.data.panes[1].label).toBe('城市')
    e2(inst.data.currentTab).toBe('city')
    e2(inst.data.currentIndex).toBe(1)
    e2(inst.data.cells.map((c: {title: string}) => c.title)).toEqual(['杭州', '宁波'])
  })

  i2('show observer → pickerShow', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    e2(inst.data.pickerShow).toBe(true)
    inst.setData({show: false})
    e2(inst.data.pickerShow).toBe(false)
  })

  i2('defaultValue observer：非空数组截断写入 selected；空数组/非数组保持', () => {
    const inst = mountDef(comp.def, {props: {data: TREE, defaultValue: ['zj']}})
    inst.attached()
    e2(inst.data.selected).toEqual(['zj'])
    inst.setData({defaultValue: ['js']})
    e2(inst.data.selected).toEqual(['js'])
    inst.setData({defaultValue: []})
    e2(inst.data.selected).toEqual(['js'])
    inst.setData({defaultValue: 'x' as never})
    e2(inst.data.selected).toEqual(['js'])
  })

  i2('data/selected/placeholder observer → refreshPanes', () => {
    const inst = mountDef(comp.def, {props: {data: TREE}})
    inst.attached()
    inst.setData({selected: ['js']})
    e2(inst.data.panes).toHaveLength(2)
    e2(inst.data.panes[1].label).toBe('请选择') // 子层未选中 → placeholder
    inst.setData({placeholder: '选呗'})
    e2(inst.data.panes[1].label).toBe('选呗')
  })

  i2('relations popup：linked 登记 + 推送 largeRadius；unlinked 置空', () => {
    const radii: boolean[] = []
    const popup = {setLargeRadius: (v: boolean) => radii.push(v)}
    const inst = mountDef(comp.def, {props: {largeRadius: true}})
    inst.attached() // state 在 attached 创建（relations linked 假定已存在）
    inst.linkRelation('../popup/index', popup)
    e2(stateOf(inst).popup).toBe(popup)
    e2(radii).toEqual([true])

    const rel = comp.def.relations!['../popup/index']
    rel.unlinked!.call(inst, popup as never)
    e2(stateOf(inst).popup).toBe(null)
  })
})

d2('tab-picker popup 桥接与取消恢复', () => {
  i2('onPopupChange：false 关闭 + change(false)；suppressChange 抑制一次；true/无 detail 忽略', () => {
    const inst = mountDef(comp.def, {props: {data: TREE}})
    inst.attached()
    inst.setData({show: true})
    inst.methods.onPopupChange.call(inst, {detail: {value: true}} as never)
    e2(inst.events).toEqual([])
    inst.methods.onPopupChange.call(inst, {} as never)
    e2(inst.events).toEqual([])

    stateOf(inst).suppressChange = true
    inst.methods.onPopupChange.call(inst, {detail: {value: false}} as never)
    e2(inst.data.pickerShow).toBe(false)
    e2(inst.eventsOf('change')).toEqual([]) // 被抑制
    e2(stateOf(inst).suppressChange).toBe(false) // 复位

    inst.setData({show: true})
    inst.methods.onPopupChange.call(inst, {detail: {value: false}} as never)
    e2(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: false}}])
  })

  i2('onPopupShow/onPopupHide：show/hide 事件 + 100ms 稳定快照', () => {
    const inst = mountDef(comp.def, {props: {data: TREE, defaultValue: ['zj']}})
    inst.attached()
    inst.methods.onPopupShow.call(inst)
    e2(inst.eventsOf('show')).toHaveLength(1)
    e2(stateOf(inst).oldSelected).toEqual([]) // 未快照
    vi.advanceTimersByTime(100)
    e2(stateOf(inst).oldSelected).toEqual(['zj'])
    e2(stateOf(inst).oldCurrentTab).toBe('city')

    inst.methods.onPopupHide.call(inst)
    e2(inst.eventsOf('hide')).toHaveLength(1)
  })

  i2('onCancel：pickerShow 收起 + 100ms 后恢复快照（无快照回空）', () => {
    const inst = mountDef(comp.def, {props: {data: TREE, defaultValue: ['zj']}})
    inst.attached()
    inst.setData({show: true})
    inst.methods.onCancel.call(inst)
    e2(inst.data.pickerShow).toBe(false)
    vi.advanceTimersByTime(100)
    e2(inst.data.selected).toEqual([]) // 无快照 → oldSelected []
    e2(inst.data.currentTab).toBe('level0')

    // 隐藏态 onCancel 同样恢复
    inst.setData({selected: ['js']})
    inst.methods.onCancel.call(inst)
    vi.advanceTimersByTime(100)
    e2(inst.data.selected).toEqual([])
  })

  i2('detached：快照/恢复定时器清理', () => {
    const inst = mountDef(comp.def, {props: {data: TREE}})
    inst.attached()
    inst.setData({selected: ['zj']})
    inst.methods.onCancel.call(inst)
    inst.detached()
    vi.advanceTimersByTime(200)
    e2(inst.data.selected).toEqual(['zj']) // 恢复未执行
  })
})

d2('tab-picker 完整选择流', () => {
  i2('叶子选择（单层树）：select + 300ms 延迟 change{values,options} + 关闭', async () => {
    const inst = mountDef(comp.def, {
      props: {data: {name: 'l0', label: '层0', options: [{value: 'a', label: 'A'}, {value: 'b', label: 'B'}]}},
    })
    inst.attached()
    inst.setData({show: true})

    inst.methods.onOptionTap.call(inst, tap(0))
    e2(inst.data.selected).toEqual(['a'])
    await vi.advanceTimersByTimeAsync(1) // 0ms 后 __afterSelect
    e2(inst.eventsOf('select')).toEqual([
      {name: 'select', detail: {index: 0, value: 'a', option: {value: 'a', label: 'A'}}},
    ])
    e2(inst.eventsOf('change')).toEqual([]) // 300ms 内未派发
    await vi.advanceTimersByTimeAsync(300)
    e2(inst.eventsOf('change')).toEqual([
      {
        name: 'change',
        detail: {value: false, values: ['a'], options: [{value: 'a', label: 'A'}]},
      },
    ])
    e2(inst.data.pickerShow).toBe(false)
    e2(stateOf(inst).suppressChange).toBe(true) // 抑制 popup 桥接的重复 change
    e2(inst.methods.getSelectedValues.call(inst)).toEqual(['a'])
    e2(inst.methods.getSelectedOptions.call(inst)).toEqual([{value: 'a', label: 'A'}])
  })

  i2('非叶子选择：select 载荷指向点击面板，进入下一级面板（不提前关闭）', async () => {
    const inst = mountDef(comp.def, {props: {data: TREE}})
    inst.attached()
    inst.setData({show: true})

    inst.methods.onOptionTap.call(inst, tap(0)) // 浙江（非叶子）
    await vi.advanceTimersByTimeAsync(1)
    // select 载荷以捕获的点击面板序号/选项为准（Vue onSelectPaneItem 语义：
    // onOptionTap 在 setData 前捕获 tappedPaneIndex，selected observer 推进
    // currentIndex 不影响回调）
    e2(inst.eventsOf('select')).toEqual([
      {name: 'select', detail: {index: 0, value: 'zj', option: TREE.options[0]}},
    ])
    await vi.advanceTimersByTimeAsync(300)
    // 有下一层：不触发 change、不关闭，进入「城市」面板
    e2(inst.eventsOf('change')).toEqual([])
    e2(inst.data.pickerShow).toBe(true)
    e2(inst.data.currentIndex).toBe(1)
    e2((inst.data.panes as TabPickerPane[])[1].label).toBe('城市')
  })

  i2('__afterSelect 直调（白盒）：有下一层时切 tab + 复位滚动', async () => {
    const inst = mountDef(comp.def, {props: {data: TREE, defaultValue: ['zj']}})
    inst.attached() // panes 两层，currentIndex 1
    inst.methods.__afterSelect.call(inst, 'zj', 0) // 显式点击层 index 0
    e2(inst.data.currentTab).toBe('city')
    e2(inst.data.currentIndex).toBe(1)
    e2(inst.data.paneScrollTop).toBe(0.1) // 交替复位（初值 0）
    e2(inst.data.tabIntoView).toBe('tp-tab-1')
  })

  i2('onTabTap：切回前层面板 + 滚动位 0/0.1 交替；越界早退', () => {
    const inst = mountDef(comp.def, {props: {data: TREE, defaultValue: ['zj']}})
    inst.attached()
    e2(inst.data.paneScrollTop).toBe(0)
    inst.methods.onTabTap.call(inst, tap(0)) // 切回 level0
    e2(inst.data.currentTab).toBe('level0')
    e2(inst.data.tabIntoView).toBe('tp-tab-0')
    e2(inst.data.paneScrollTop).toBe(0.1)
    inst.methods.onTabTap.call(inst, tap(1)) // 再切到 city
    e2(inst.data.paneScrollTop).toBe(0) // 交替
    e2(inst.data.cells.map((c: {title: string}) => c.title)).toEqual(['杭州', '宁波'])
    inst.methods.onTabTap.call(inst, tap(9)) // 越界
    e2(inst.data.currentTab).toBe('city')
  })

  i2('onOptionTap：越界/禁用早退', () => {
    const inst = mountDef(comp.def, {
      props: {data: {name: 'l0', options: [{value: 'a'}, {value: 'b', disabled: true}]}},
    })
    inst.attached()
    inst.methods.onOptionTap.call(inst, tap(9))
    e2(inst.data.selected).toEqual([])
    inst.methods.onOptionTap.call(inst, tap(1)) // disabled
    e2(inst.data.selected).toEqual([])
    e2(inst.eventsOf('select')).toEqual([])
  })

  i2('getSelectedOptions：过滤 value 为 undefined/空 的面板', () => {
    const inst = mountDef(comp.def, {props: {data: TREE}})
    inst.attached()
    e2(inst.methods.getSelectedOptions.call(inst)).toEqual([]) // 未选中层被过滤
    inst.setData({selected: ['js']})
    e2(inst.methods.getSelectedOptions.call(inst)).toEqual([TREE.options[1]])
  })
})
