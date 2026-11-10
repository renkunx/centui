/**
 * check / check-group 纯逻辑测试：check/uncheck/toggle/toggleAll 与 max 语义，
 * 逐一对照 Vue 版 CheckGroup.vue 与 check/shared.ts useCheckDelegate。
 */
import {describe, it, expect} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'
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

// ---------------------------------------------------------------------------
// check 组件实例（index.ts）：observers / relations / ready 插槽探测 / onTap
// ---------------------------------------------------------------------------
const comp = await loadComponent(() => import('../../src/components/check/index'))

interface CheckView {
  isChecked: boolean
  currentIcon: string
  hasDefault: boolean
}

function view(inst: Mounted): CheckView {
  return {
    isChecked: inst.data.isChecked as boolean,
    currentIcon: inst.data.currentIcon as string,
    hasDefault: inst.data.hasDefault as boolean,
  }
}

describe('check 组件 attached 初始派生（observers 不触发初始值）', () => {
  it('value=name 命中 → isChecked + 选中 icon', () => {
    const inst = mountDef(comp.def, {props: {value: true}})
    inst.attached()
    expect(view(inst)).toMatchObject({isChecked: true, currentIcon: 'checked', hasDefault: true})
  })

  it('未选中 → 反向 icon；disabled → 禁用 icon 优先', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(view(inst)).toMatchObject({isChecked: false, currentIcon: 'check'})

    const off = mountDef(comp.def, {props: {disabled: true, value: true}})
    off.attached()
    expect(view(off).currentIcon).toBe('check-disabled')
  })

  it('自定义 icon 三态', () => {
    const inst = mountDef(comp.def, {
      props: {value: false, icon: 'i-on', iconInverse: 'i-off', iconDisabled: 'i-dis'},
    })
    inst.attached()
    expect(view(inst).currentIcon).toBe('i-off')
    inst.setData({value: true})
    expect(view(inst).currentIcon).toBe('i-on')
    inst.setData({disabled: true})
    expect(view(inst).currentIcon).toBe('i-dis')
  })
})

describe('check 组件 observers', () => {
  it('value 变更刷新 isChecked', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({value: true})
    expect(view(inst).isChecked).toBe(true)
    inst.setData({value: false})
    expect(view(inst).isChecked).toBe(false)
  })

  it('groupValue 为 null 时按空组处理（|| [] 分支）', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.methods.receiveGroupValue(null)
    expect(inst.data.groupValue).toEqual([])
    expect(view(inst).isChecked).toBe(false)
    // data.groupValue 直接处于 null 态（异常数据）→ refresh 的 || [] 兜底
    inst.setData({groupValue: null})
    expect(view(inst).isChecked).toBe(false)
  })

  it('receiveGroupValue 命中 name → isChecked', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.attached()
    inst.methods.receiveGroupValue(['a'])
    expect(view(inst).isChecked).toBe(true)
  })
})

describe('check 组件 relations（cu-check-group ancestor）', () => {
  it('linked：登记组并同步组值（parent.data.value）', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.linkRelation('../check-group/index', {data: {value: ['a']}})
    expect((inst as unknown as {__checkGroup: unknown}).__checkGroup).toBeTruthy()
    expect(view(inst).isChecked).toBe(true)
  })

  it('linked：parent 无 data 时按空组（?? {} 分支）', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.linkRelation('../check-group/index', {})
    expect(inst.data.groupValue).toEqual([])
    expect(view(inst).isChecked).toBe(false)
  })

  it('unlinked：解除登记后 onTap 不再上报组', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.linkRelation('../check-group/index', {data: {value: []}})
    const rel = comp.def.relations!['../check-group/index']
    rel.unlinked!.call(inst)
    expect((inst as unknown as {__checkGroup: unknown}).__checkGroup).toBeNull()
    inst.methods.onTap()
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'a'}}])
  })
})

describe('check 组件 onTap', () => {
  it('disabled 点击不触发', () => {
    const inst = mountDef(comp.def, {props: {disabled: true}})
    inst.methods.onTap()
    expect(inst.events).toEqual([])
    expect(inst.data.value).toBe(false)
  })

  it('布尔名：乐观取反 + change', () => {
    const inst = mountDef(comp.def)
    inst.methods.onTap()
    expect(inst.data.value).toBe(true)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: true}}])
    inst.methods.onTap()
    expect(inst.data.value).toBe(false)
  })

  it('非布尔名：未选上报 name；再点反选为 \'\'', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.methods.onTap()
    expect(inst.data.value).toBe('a')
    inst.methods.onTap()
    expect(inst.data.value).toBe('')
  })

  it('有组且非布尔名：toggleChild 上报（check/uncheck 由组裁决）', () => {
    const toggled: unknown[] = []
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.linkRelation('../check-group/index', {
      data: {value: []},
      toggleChild(n: unknown) {
        toggled.push(n)
      },
    })
    inst.methods.onTap()
    expect(toggled).toEqual(['a'])
  })

  it('布尔名即使有组也不上报；组无 toggleChild 不崩溃', () => {
    const inst = mountDef(comp.def)
    inst.linkRelation('../check-group/index', {data: {value: []}})
    expect(() => inst.methods.onTap()).not.toThrow()
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: true}}])
  })

  it('非布尔名 + 组无 toggleChild：只走自身 v-model（typeof 守卫 false 分支）', () => {
    const inst = mountDef(comp.def, {props: {name: 'a'}})
    inst.linkRelation('../check-group/index', {data: {value: []}})
    expect(() => inst.methods.onTap()).not.toThrow()
    expect(inst.data.value).toBe('a')
  })
})

describe('check 组件 ready 默认插槽探测', () => {
  it('空插槽（height 0）→ 回退 label 文本（hasDefault false）', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-check-label': {height: 0}}})
    inst.ready()
    expect(view(inst).hasDefault).toBe(false)
  })

  it('有插槽内容 → 保持 true；探测 rect null → 不回写', () => {
    const filled = mountDef(comp.def, {rects: {'.cu-check-label': {height: 22}}})
    filled.ready()
    expect(view(filled).hasDefault).toBe(true)

    const missing = mountDef(comp.def)
    missing.ready()
    expect(view(missing).hasDefault).toBe(true)
  })
})
