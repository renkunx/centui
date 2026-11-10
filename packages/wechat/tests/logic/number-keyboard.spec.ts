/**
 * number-keyboard 纯逻辑测试：键位布局（KeyboardBoard 模板逐段对照）与乱序生成
 * （generateKeyNumber 的乱序语义，固定随机源验证）。
 */
import {describe, it, expect} from 'vitest'
import {
  buildNumberKeys,
  buildOperateKeys,
  generateKeyNumberList,
} from '../../src/components/number-keyboard/logic'

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
