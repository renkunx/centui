/**
 * number-keyboard 纯逻辑测试：键位布局（KeyboardBoard 模板逐段对照）与乱序生成
 * （generateKeyNumber 的乱序语义，固定随机源验证）+ 组件层（index.ts）：
 * 显隐双向回流、okText 解析、键位 press 事件矩阵（touch/tap/disabled）。
 */
import {describe, it, expect} from 'vitest'
import {
  buildNumberKeys,
  buildOperateKeys,
  generateKeyNumberList,
} from '../../src/components/number-keyboard/logic'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/number-keyboard/index'))

const ORDERED = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

describe('number-keyboard/键位数据', () => {
  it('generateKeyNumberList：默认顺序 1..9,0（KeyboardBoard baseStack）', () => {
    expect(generateKeyNumberList(false)).toEqual(ORDERED)
  })

  it('generateKeyNumberList：disorder 为 0-9 的不重样排列（固定随机源）', () => {
    // random=0.9 → 每次取剩余栈末位 → 逆序排列
    const random = () => 0.9
    const list = generateKeyNumberList(true, random)
    expect(list.slice().sort()).toEqual(ORDERED.slice().sort())
    expect(list).toEqual(['0', '9', '8', '7', '6', '5', '4', '3', '2', '1'])
  })

  it('generateKeyNumberList：disorder 各次调用独立重排（Vue 创建期生成一次的语义）', () => {
    let calls = 0
    const random = () => {
      calls++
      return calls % 2 === 0 ? 0.9 : 0.1
    }
    const a = generateKeyNumberList(true, random)
    const b = generateKeyNumberList(true, random)
    expect(a.slice().sort()).toEqual(ORDERED.slice().sort())
    expect(b.slice().sort()).toEqual(ORDERED.slice().sort())
  })
})

describe('number-keyboard/professional 键区布局', () => {
  const base = {type: 'professional', keyNumberList: ORDERED, hideDot: false, duplicateZero: false, isView: false}

  it('默认布局：9 数字 + 小数点 + 0 + 收起键（共 12 格）', () => {
    const keys = buildNumberKeys(base)
    expect(keys).toHaveLength(12)
    expect(keys.slice(0, 9).map(k => k.value)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    expect(keys[9]).toMatchObject({value: '.', kind: 'dot', ariaLabel: '小数点', touch: true})
    expect(keys[10]).toMatchObject({value: '0', kind: 'number', ariaLabel: '0'})
    expect(keys[11]).toMatchObject({value: '', kind: 'slidedown', cls: 'slidedown', ariaLabel: '收起键盘', touch: false})
  })

  it('hideDot：0 键扩大（large-item）且无小数点', () => {
    const keys = buildNumberKeys({...base, hideDot: true})
    expect(keys).toHaveLength(11)
    expect(keys[9]).toMatchObject({kind: 'number', value: '0', cls: 'large-item'})
    expect(keys[10]).toMatchObject({kind: 'slidedown'})
  })

  it('duplicateZero：0 键 + 00 键 + 小数点（Vue 模板三键组合）', () => {
    const keys = buildNumberKeys({...base, duplicateZero: true})
    expect(keys).toHaveLength(12)
    expect(keys[9]).toMatchObject({value: '0', kind: 'dot', ariaLabel: '0'})
    expect(keys[10]).toMatchObject({value: '00', kind: 'number', ariaLabel: '00'})
    expect(keys[11]).toMatchObject({value: '.', kind: 'dot', ariaLabel: '小数点'})
  })

  it('isView：收起键替换为空占位（Vue isView li）', () => {
    const keys = buildNumberKeys({...base, isView: true})
    expect(keys[11]).toMatchObject({kind: 'empty', value: ''})
  })
})

describe('number-keyboard/simple 键区布局', () => {
  it('9 数字 + 空位(no-bg) + 0 + 删除键(no-bg delete)', () => {
    const keys = buildNumberKeys({type: 'simple', keyNumberList: ORDERED, hideDot: false, duplicateZero: false, isView: false})
    expect(keys).toHaveLength(12)
    expect(keys[9]).toMatchObject({kind: 'empty', cls: 'no-bg'})
    expect(keys[10]).toMatchObject({kind: 'number', value: '0'})
    expect(keys[11]).toMatchObject({kind: 'delete', cls: 'no-bg delete', ariaLabel: '删除', touch: true})
  })
})

describe('number-keyboard/操作列', () => {
  it('professional 操作列：删除键 + 确认键（okText/aria）', () => {
    const keys = buildOperateKeys('确定')
    expect(keys).toHaveLength(2)
    expect(keys[0]).toMatchObject({kind: 'delete', cls: 'delete', ariaLabel: '删除', touch: true})
    expect(keys[1]).toMatchObject({kind: 'confirm', value: '确定', ariaLabel: '确定', touch: false})
  })

  it('数字键 aria-label 为键值字符串（无障碍契约）', () => {
    const keys = buildNumberKeys({
      type: 'professional',
      keyNumberList: generateKeyNumberList(true, () => 0),
      hideDot: false,
      duplicateZero: false,
      isView: false,
    })
    for (const key of keys.filter(k => k.kind === 'number')) {
      expect(key.ariaLabel).toBe(key.value)
    }
  })
})

describe('number-keyboard/键位数据兜底', () => {
  it('keyNumberList 不足 10 位：数字键值回退空串/0（?? 分支）', () => {
    const prof = buildNumberKeys({
      type: 'professional', keyNumberList: [], hideDot: false, duplicateZero: false, isView: false,
    })
    expect(prof[0].value).toBe('')
    expect(prof[10]).toMatchObject({value: '0', ariaLabel: '0'})
    const simple = buildNumberKeys({
      type: 'simple', keyNumberList: [], hideDot: false, duplicateZero: false, isView: false,
    })
    expect(simple[10]).toMatchObject({value: '0', ariaLabel: '0'})
  })
})

/**
 * 组件层（index.ts）：显隐双向回流（show → innerShow → change）、okText 解析、
 * __rebuild 重建、popup 转发、键位 press 事件矩阵（touchstart/tap、disabled、
 * number/dot/delete/slidedown/confirm/empty 各 kind）。
 */
describe('number-keyboard 组件', () => {
  const ORDERED = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

  it('attached：默认 professional 键区 + 默认确定文案', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.innerShow).toBe(false)
    expect(inst.data.resolvedType).toBe('professional')
    expect(inst.data.keyNumberList).toEqual(ORDERED)
    expect(inst.data.okTextResolved).toBe('确定')
    expect(inst.data.numberKeys).toHaveLength(12)
    expect(inst.data.operateKeys).toHaveLength(2)
    expect(inst.data.activeKey).toBe(-1)
  })

  it('attached：disorder 生成 0-9 不重样排列；okText 属性生效', () => {
    const inst = mountDef(comp.def, {props: {disorder: true, okText: '支付'}})
    inst.attached()
    expect([...inst.data.keyNumberList].sort()).toEqual([...ORDERED].sort())
    expect(inst.data.okTextResolved).toBe('支付')
    expect(inst.data.operateKeys[1]).toMatchObject({value: '支付', ariaLabel: '支付'})
  })

  it('attached：simple 类型 operateKeys 为空', () => {
    const inst = mountDef(comp.def, {props: {type: 'simple'}})
    inst.attached()
    expect(inst.data.resolvedType).toBe('simple')
    expect(inst.data.operateKeys).toEqual([])
    expect(inst.data.numberKeys[11]).toMatchObject({kind: 'delete'})
  })

  it('observers：show → innerShow → change {value}（双向回流）', () => {
    const inst = mountDef(comp.def)
    inst.setData({show: true})
    expect(inst.data.innerShow).toBe(true)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: true}}])
    inst.setData({show: false})
    expect(inst.eventsOf('change')[1].detail).toEqual({value: false})
  })

  it('show()/hide() 一等 API（change 由 innerShow observer 派发）', () => {
    const inst = mountDef(comp.def)
    inst.methods.show.call(inst)
    expect(inst.data.innerShow).toBe(true)
    expect(inst.eventsOf('change')[0].detail).toEqual({value: true})
    inst.methods.hide.call(inst)
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')[1].detail).toEqual({value: false})
  })

  it('okText observer：显式文案生效；null 回落默认（?? 分支）', () => {
    const inst = mountDef(comp.def)
    inst.setData({okText: '支付'})
    expect(inst.data.okTextResolved).toBe('支付')
    inst.setData({okText: null})
    expect(inst.data.okTextResolved).toBe('确定')
  })

  it('__rebuild：type/hideDot/duplicateZero/isView 变更重建键区', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({type: 'simple'})
    expect(inst.data.resolvedType).toBe('simple')
    expect(inst.data.operateKeys).toEqual([])
    inst.setData({type: '', hideDot: true})
    expect(inst.data.resolvedType).toBe('professional')
    expect(inst.data.numberKeys).toHaveLength(11)
    expect(inst.data.numberKeys[9]).toMatchObject({kind: 'number', cls: 'large-item'})
    inst.setData({hideDot: false, duplicateZero: true})
    expect(inst.data.numberKeys[9]).toMatchObject({value: '0', kind: 'dot'})
    expect(inst.data.numberKeys[10]).toMatchObject({value: '00', kind: 'number'})
    expect(inst.data.numberKeys[11]).toMatchObject({value: '.', kind: 'dot'})
    // duplicateZero 复位后，isView 将收起键替换为空占位
    inst.setData({duplicateZero: false, isView: true})
    expect(inst.data.numberKeys[11]).toMatchObject({value: '', kind: 'empty'})
  })

  it('__rebuild：keyNumberList 非法（长度≠10）时重新生成', () => {
    const inst = mountDef(comp.def)
    inst.setData({keyNumberList: []})
    inst.setData({type: 'simple'})
    expect(inst.data.keyNumberList).toHaveLength(10)
    expect(inst.data.numberKeys).toHaveLength(12)
  })

  it('onPopupChange：value=true 早退；false 收起（change 由 observer 回流）', () => {
    const inst = mountDef(comp.def)
    inst.methods.onPopupChange.call(inst, {detail: {value: true}})
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')).toEqual([])
    inst.methods.show.call(inst)
    inst.methods.onPopupChange.call(inst, {detail: {value: false}})
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {value: true}},
      {name: 'change', detail: {value: false}},
    ])
  })

  it('onPopupShow/onPopupHide：转发 popup 状态机事件', () => {
    const inst = mountDef(comp.def)
    inst.methods.onPopupShow.call(inst)
    inst.methods.onPopupHide.call(inst)
    expect(inst.eventsOf('show')).toHaveLength(1)
    expect(inst.eventsOf('hide')).toHaveLength(1)
  })

  it('onKeyTouchStart/End：touch 键激活并 press；operate 区同理', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.onKeyTouchStart.call(inst, {currentTarget: {dataset: {zone: 'number', index: 0}}})
    expect(inst.data.activeKey).toBe(0)
    expect(inst.eventsOf('enter')).toEqual([{name: 'enter', detail: {value: '1'}}])
    inst.methods.onKeyTouchEnd.call(inst, {currentTarget: {dataset: {zone: 'number'}}})
    expect(inst.data.activeKey).toBe(-1)

    inst.methods.onKeyTouchStart.call(inst, {currentTarget: {dataset: {zone: 'operate', index: 0}}})
    expect(inst.data.activeOperate).toBe(0)
    expect(inst.eventsOf('delete')).toHaveLength(1)
    inst.methods.onKeyTouchEnd.call(inst, {currentTarget: {dataset: {zone: 'operate'}}})
    expect(inst.data.activeOperate).toBe(-1)
  })

  it('onKeyTouchStart：no-touch 键（slidedown）不 press', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    const slidedownIdx = inst.data.numberKeys.findIndex((k: {kind: string}) => k.kind === 'slidedown')
    inst.methods.onKeyTouchStart.call(inst, {currentTarget: {dataset: {zone: 'number', index: slidedownIdx}}})
    expect(inst.data.activeKey).toBe(slidedownIdx)
    expect(inst.data.innerShow).toBe(false) // 未收起（未 press）
    expect(inst.events).toEqual([])
  })

  it('onKeyTap：no-touch 键 press（slidedown 收起 / confirm 确认并收起）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    const slidedownIdx = inst.data.numberKeys.findIndex((k: {kind: string}) => k.kind === 'slidedown')
    inst.methods.onKeyTap.call(inst, {currentTarget: {dataset: {zone: 'number', index: slidedownIdx}}})
    expect(inst.data.innerShow).toBe(false)
    // touch 键经 tap 不触发（由 touchstart 处理）
    inst.methods.onKeyTap.call(inst, {currentTarget: {dataset: {zone: 'number', index: 0}}})
    expect(inst.eventsOf('enter')).toEqual([])
    // confirm 键（isHideConfirm 默认 true → 确认后收起）
    inst.setData({show: true})
    inst.methods.onKeyTap.call(inst, {currentTarget: {dataset: {zone: 'operate', index: 1}}})
    expect(inst.eventsOf('confirm')).toHaveLength(1)
    expect(inst.data.innerShow).toBe(false)
  })

  it('__press：isHideConfirm=false 确认后不自动收起', () => {
    const inst = mountDef(comp.def, {props: {isHideConfirm: false}})
    inst.attached()
    inst.setData({show: true})
    inst.methods.onKeyTap.call(inst, {currentTarget: {dataset: {zone: 'operate', index: 1}}})
    expect(inst.eventsOf('confirm')).toHaveLength(1)
    expect(inst.data.innerShow).toBe(true)
  })

  it('__press：disabled 阻断 press（active 视觉仍置位）；空 cell 静默；dot 键 enter', () => {
    const disabled = mountDef(comp.def, {props: {disabled: true}})
    disabled.attached()
    disabled.methods.onKeyTouchStart.call(disabled, {currentTarget: {dataset: {zone: 'number', index: 0}}})
    expect(disabled.data.activeKey).toBe(0)
    expect(disabled.eventsOf('enter')).toEqual([])

    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.onKeyTap.call(inst, {currentTarget: {dataset: {zone: 'number', index: 99}}})
    expect(inst.events).toEqual([])
    const dotIdx = inst.data.numberKeys.findIndex((k: {kind: string}) => k.kind === 'dot')
    inst.methods.onKeyTouchStart.call(inst, {currentTarget: {dataset: {zone: 'number', index: dotIdx}}})
    expect(inst.eventsOf('enter')[0].detail).toEqual({value: '.'})
  })

  it('__press：empty 键走 default 分支（无事件派发）', () => {
    const inst = mountDef(comp.def, {props: {type: 'simple'}})
    inst.attached()
    const emptyIdx = inst.data.numberKeys.findIndex((k: {kind: string}) => k.kind === 'empty')
    inst.methods.onKeyTap.call(inst, {currentTarget: {dataset: {zone: 'number', index: emptyIdx}}})
    expect(inst.events).toEqual([])
  })

  it('__press：cell 缺失（越界直接调用）→ 静默返回（!cell 守卫）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.__press.call(inst, 'number', 99)
    inst.methods.__press.call(inst, 'operate', 99)
    expect(inst.events).toEqual([])
  })

  it('noop：可安全调用（wxml 占位处理器）', () => {
    const inst = mountDef(comp.def)
    expect(() => inst.methods.noop.call(inst)).not.toThrow()
  })
})
