import {describe, it, expect} from 'vitest'
import {buildNoLabel} from '../../src/components/bill/logic'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/bill/index'))

describe('bill/logic', () => {
  it('NO. 前缀拼接：string 与 number 一致（对齐 Vue NO.{{ no }}）', () => {
    expect(buildNoLabel('123')).toBe('NO.123')
    expect(buildNoLabel(123)).toBe('NO.123')
  })
})

/**
 * 组件层（index.ts）：no observer / attached 首帧派生 noLabel
 * （properties 初始值不触发 observers，attached 显式补派生）。
 */
describe('bill 组件', () => {
  it('attached：初始 no（string|number）派生 noLabel', () => {
    const inst = mountDef(comp.def, {props: {no: 'A2024001', title: '账单'}})
    inst.attached()
    expect(inst.data.noLabel).toBe('NO.A2024001')

    const numInst = mountDef(comp.def, {props: {no: 456}})
    numInst.attached()
    expect(numInst.data.noLabel).toBe('NO.456')
  })

  it('no observer：变更驱动 noLabel 重算', () => {
    const inst = mountDef(comp.def)
    inst.setData({no: 'B002'})
    expect(inst.data.noLabel).toBe('NO.B002')
    inst.setData({no: 0})
    expect(inst.data.noLabel).toBe('NO.0')
  })
})
