import {describe, it, expect} from 'vitest'
import {rowWidthStyle, rowStyleAt, titleWidthStyle, DEFAULT_WIDTH, DEFAULT_TITLE_WIDTH} from '../../src/components/skeleton/logic'

describe('skeleton/logic', () => {
  it('rowWidth 为数值时补 %，字符串原样', () => {
    expect(rowWidthStyle(30, 0)).toBe('30%')
    expect(rowWidthStyle('30px', 0)).toBe('30px')
  })

  it('rowWidth 为数组时按位取值，缺位回退 100%', () => {
    expect(rowWidthStyle([100, '40%'], 0)).toBe('100%')
    expect(rowWidthStyle([100, '40%'], 1)).toBe('40%')
    expect(rowWidthStyle([100], 3)).toBe(DEFAULT_WIDTH)
  })

  it('rowWidth 缺省时回退 100%', () => {
    expect(rowWidthStyle(undefined, 0)).toBe(DEFAULT_WIDTH)
    expect(rowWidthStyle('', 0)).toBe(DEFAULT_WIDTH)
  })

  it('最后一行（index === row-1）固定 60%', () => {
    expect(rowStyleAt('100%', 2, 3)).toBe('60%')
    expect(rowStyleAt('100%', 0, 3)).toBe('100%')
    expect(rowStyleAt(['80%', '70%'], 2, 3)).toBe('60%')
  })

  it('titleWidth：数值补 %，字符串原样，缺省 40%', () => {
    expect(titleWidthStyle(50)).toBe('50%')
    expect(titleWidthStyle('80px')).toBe('80px')
    expect(titleWidthStyle(undefined)).toBe(DEFAULT_TITLE_WIDTH)
  })
})

// ---------------------------------------------------------------------------
// skeleton 组件实例（index.ts）：observers / attached 兜底
// ---------------------------------------------------------------------------
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/skeleton/index'))

describe('skeleton 组件实例', () => {
  it('attached：初始 rows/rowStyles/titleStyle 派生（properties 初始值不触发 observer，真机语义）', () => {
    const inst = mountDef(comp.def, {
      props: {row: 3, rowWidth: ['80%', '60%', '40%'], titleWidth: 50, title: true},
    })
    expect(inst.data.rows).toEqual([]) // attached 前未派生
    inst.attached()
    expect(inst.data.rows).toEqual([1, 2, 3])
    expect(inst.data.rowStyles).toEqual(['80%', '60%', '60%'])
    expect(inst.data.titleStyle).toBe('50%')
  })

  it('observer row/rowWidth：变更重算（末行固定 60%，数值补 %）', () => {
    const inst = mountDef(comp.def, {props: {row: 2}})
    inst.attached()
    inst.setData({row: 4, rowWidth: 30})
    expect(inst.data.rows).toEqual([1, 2, 3, 4])
    expect(inst.data.rowStyles).toEqual(['30%', '30%', '30%', '60%'])
  })

  it('observer rowWidth 数组形态', () => {
    const inst = mountDef(comp.def, {props: {row: 2}})
    inst.attached()
    inst.setData({rowWidth: ['90%', '70%']})
    expect(inst.data.rowStyles).toEqual(['90%', '60%'])
  })

  it('observer titleWidth：数值/字符串两路', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({titleWidth: '80px'})
    expect(inst.data.titleStyle).toBe('80px')
    inst.setData({titleWidth: 60})
    expect(inst.data.titleStyle).toBe('60%')
  })

  it('attached：row=0 时不兜底（rows 保持空）', () => {
    const inst = mountDef(comp.def, {props: {row: 0}})
    inst.attached()
    expect(inst.data.rows).toEqual([])
    expect(inst.data.rowStyles).toEqual([])
  })
})
