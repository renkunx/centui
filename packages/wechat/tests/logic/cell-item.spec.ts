/**
 * cell-item 逻辑层测试（对照 Vue 版 test/components/cell-item.spec.ts 行为清单）：
 * 1. 点击守卫：disabled 不触发 click
 * 2. observer：title/brief/addon/arrow 驱动包裹显隐
 * 3. ready 插槽探测：空包裹隐藏、rightFilled 判定
 */
import {describe, expect, it} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/cell-item/index'))

describe('cell-item 点击', () => {
  it('正常点击触发 click', () => {
    const inst = mountDef(comp.def)
    inst.methods.onTap.call(inst)
    expect(inst.eventsOf('click')).toHaveLength(1)
  })

  it('disabled 点击不触发', () => {
    const inst = mountDef(comp.def, {props: {disabled: true}})
    inst.methods.onTap.call(inst)
    expect(inst.events).toEqual([])
  })
})

describe('cell-item 包裹显隐', () => {
  it('title/brief 变更保持 content 显示', () => {
    const inst = mountDef(comp.def)
    inst.setData({title: '标题'})
    expect(inst.data.showContent).toBe(true)
    inst.setData({brief: '副标题'})
    expect(inst.data.showContent).toBe(true)
  })

  it('addon/arrow 变更保持 right 显示', () => {
    const inst = mountDef(comp.def)
    inst.setData({addon: '说明'})
    expect(inst.data.showRight).toBe(true)
    inst.setData({addon: '', arrow: true})
    expect(inst.data.showRight).toBe(true)
  })
})

describe('cell-item ready 插槽探测', () => {
  it('空 left/content/children 隐藏；right 未填充且无 addon/arrow 隐藏', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-cell-item-left': {height: 0},
        '.cu-cell-item-content': {height: 0},
        '.cu-cell-item-right': {height: 0},
        '.cu-cell-item-children': {height: 0},
      },
    })
    inst.ready()
    expect(inst.data.showLeft).toBe(false)
    expect(inst.data.showContent).toBe(false)
    expect(inst.data.showChildren).toBe(false)
    expect(inst.data.rightFilled).toBe(false)
    expect(inst.data.showRight).toBe(false)
  })

  it('有 title 时 content 保持显示', () => {
    const inst = mountDef(comp.def, {
      props: {title: '标题'},
      rects: {
        '.cu-cell-item-content': {height: 40},
        '.cu-cell-item-right': {height: 40},
      },
    })
    inst.ready()
    expect(inst.data.showContent).toBe(true)
    expect(inst.data.rightFilled).toBe(true)
    expect(inst.data.showRight).toBe(true)
  })

  it('right 空但有 addon：保持显示', () => {
    const inst = mountDef(comp.def, {
      props: {addon: '详情'},
      rects: {'.cu-cell-item-right': {height: 0}},
    })
    inst.ready()
    expect(inst.data.showRight).toBe(true)
  })

  it('right 探针节点缺失（rect null）：rightFilled/showRight 保持初始', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-cell-item-left': {height: 0},
        '.cu-cell-item-content': {height: 0},
        '.cu-cell-item-children': {height: 0},
        // '.cu-cell-item-right' 缺省 → rect null
      },
    })
    inst.ready()
    expect(inst.data.showLeft).toBe(false)
    expect(inst.data.showContent).toBe(false)
    expect(inst.data.showChildren).toBe(false)
    expect(inst.data.rightFilled).toBe(true) // rect null 不回写
    expect(inst.data.showRight).toBe(true)
  })

  it('全部包裹节点非空：patch 为空不回写（Object.keys 守卫 false 分支）', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-cell-item-left': {height: 10},
        '.cu-cell-item-content': {height: 10},
        '.cu-cell-item-right': {height: 10},
        '.cu-cell-item-children': {height: 10},
      },
    })
    inst.ready()
    expect(inst.data.showLeft).toBe(true)
    expect(inst.data.showContent).toBe(true)
    expect(inst.data.rightFilled).toBe(true)
    expect(inst.data.showRight).toBe(true)
    expect(inst.data.showChildren).toBe(true)
  })

  it('right 探针缺失且其余节点非空：patch 全空不回写', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-cell-item-left': {height: 10},
        '.cu-cell-item-content': {height: 10},
        '.cu-cell-item-children': {height: 10},
      },
    })
    inst.ready()
    expect(inst.data.showLeft).toBe(true)
    expect(inst.data.showContent).toBe(true)
    expect(inst.data.showChildren).toBe(true)
    expect(inst.data.rightFilled).toBe(true) // 初始假定，未回写
  })

  it('content 有 title 时空探针不隐藏；left/children 探针缺失（null）跳过', () => {
    const inst = mountDef(comp.def, {
      props: {title: '标题'},
      rects: {
        '.cu-cell-item-content': {height: 0},
        '.cu-cell-item-right': {height: 0},
      },
    })
    inst.ready()
    expect(inst.data.showContent).toBe(true) // title 兜底
    expect(inst.data.rightFilled).toBe(false)
    expect(inst.data.showRight).toBe(false)
    expect(inst.data.showLeft).toBe(true) // left rect null 不动
    expect(inst.data.showChildren).toBe(true)
  })
})

describe('cell-item observer 假值分支', () => {
  it('title/brief 置空不再强制显示（val falsy 分支）', () => {
    const inst = mountDef(comp.def)
    inst.setData({title: 'x'})
    expect(inst.data.showContent).toBe(true)
    inst.setData({title: ''})
    inst.setData({brief: 'y'})
    inst.setData({brief: ''})
    expect(inst.data.showContent).toBe(true)
  })

  it('addon 与 arrow 同时为空：不触发 showRight（falsy 分支）', () => {
    const inst = mountDef(comp.def, {props: {arrow: true}})
    inst.setData({addon: 'x'}) // truthy 分支
    expect(inst.data.showRight).toBe(true)
    inst.setData({addon: '', arrow: false}) // 双空
    expect(inst.data.showRight).toBe(true) // 不重算，保持
  })
})
