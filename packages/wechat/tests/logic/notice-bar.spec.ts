import {describe, it, expect, vi, afterEach} from 'vitest'
import {rightIcon, isOverflow, buildBarClass} from '../../src/components/notice-bar/logic'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/notice-bar/index'))

afterEach(() => {
  vi.useRealTimers()
})

describe('notice-bar/logic', () => {
  it('rightIcon：link → arrow，其余（closable/空）→ close', () => {
    expect(rightIcon('link')).toBe('arrow')
    expect(rightIcon('closable')).toBe('close')
    expect(rightIcon('')).toBe('close')
  })

  it('溢出判定：contentWidth - paddingLeft > ceil(wrapWidth)（对齐 Vue checkOverflow）', () => {
    // 恰好等于 → 不算溢出（ceil 边界）
    expect(isOverflow(100, 0, 100)).toBe(false)
    expect(isOverflow(100.5, 0, 100)).toBe(true) // ceil(100) = 100，100.5 > 100
    expect(isOverflow(120, 20, 100)).toBe(false) // 120-20 = 100，不大于
    expect(isOverflow(121, 20, 100)).toBe(true)
    expect(isOverflow(50, 10, 100)).toBe(false)
  })

  it('根类名：round 修饰符 + 类型（default/activity/warning）', () => {
    expect(buildBarClass(false, 'default')).toBe('cu-notice-bar default')
    expect(buildBarClass(true, 'default')).toBe('cu-notice-bar cu-notice-bar-round default')
    expect(buildBarClass(true, 'warning')).toBe('cu-notice-bar cu-notice-bar-round warning')
  })
})

/**
 * 组件层（index.ts）：observers 派生、attached/ready/detached 生命周期、
 * 自动关闭定时器（__hide）、close 语义、左侧插槽探针（__checkLeftEmpty）、
 * 溢出探测（__checkOverflow，探测态 inline-block + 50ms 延迟度量）。
 */
describe('notice-bar 组件', () => {
  it('attached：派生 barClass/rightIconName/leftEmpty（icon 已设）', () => {
    const inst = mountDef(comp.def, {
      props: {round: true, type: 'warning', mode: 'link', icon: 'check-circle'},
    })
    inst.attached()
    expect(inst.data.barClass).toBe('cu-notice-bar cu-notice-bar-round warning')
    expect(inst.data.rightIconName).toBe('arrow')
    expect(inst.data.leftEmpty).toBe(false)
  })

  it('observers：round/type、mode、icon 各自驱动派生量', () => {
    const inst = mountDef(comp.def)
    inst.setData({round: true, type: 'activity'})
    expect(inst.data.barClass).toBe('cu-notice-bar cu-notice-bar-round activity')
    inst.setData({mode: 'link'})
    expect(inst.data.rightIconName).toBe('arrow')
    inst.setData({icon: 'sound'})
    expect(inst.data.leftEmpty).toBe(false)
  })

  it('time observer：非 0 自动关闭（到点隐藏），回设 0 不动作', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def)
    inst.setData({time: 3000})
    vi.advanceTimersByTime(2999)
    expect(inst.data.isShow).toBe(true)
    vi.advanceTimersByTime(1)
    expect(inst.data.isShow).toBe(false)
    // 回设 0：不重挂定时器（falsy 分支）
    inst.setData({time: 0})
    vi.advanceTimersByTime(10000)
    expect(inst.data.isShow).toBe(false)
  })

  it('attached：time 属性直接生效自动关闭', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {props: {time: 1000}})
    inst.attached()
    vi.advanceTimersByTime(1000)
    expect(inst.data.isShow).toBe(false)
  })

  it('detached：清理挂起定时器（hide 回调不再触发）', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def)
    inst.setData({time: 1000})
    inst.detached()
    vi.advanceTimersByTime(5000)
    expect(inst.data.isShow).toBe(true)
  })

  it('onClose：closable 语义才隐藏（mode / closable 两条路径），close 事件恒触发', () => {
    const byMode = mountDef(comp.def, {props: {mode: 'closable'}})
    byMode.methods.onClose.call(byMode)
    expect(byMode.data.isShow).toBe(false)
    expect(byMode.eventsOf('close')).toHaveLength(1)

    const byProp = mountDef(comp.def, {props: {closable: true}})
    byProp.methods.onClose.call(byProp)
    expect(byProp.data.isShow).toBe(false)
    expect(byProp.eventsOf('close')).toHaveLength(1)

    const plain = mountDef(comp.def)
    plain.methods.onClose.call(plain)
    expect(plain.data.isShow).toBe(true)
    expect(plain.eventsOf('close')).toHaveLength(1)
  })

  it('__checkLeftEmpty：图标存在直接跳过探测', () => {
    const inst = mountDef(comp.def, {props: {icon: 'x'}})
    inst.ready()
    expect(inst.data.leftEmpty).toBe(false)
  })

  it('__checkLeftEmpty：探针仍在渲染（插槽为空）→ leftEmpty true', () => {
    const inst = mountDef(comp.def, {rects: {'#cu-nb-left-probe': {height: 0}}})
    inst.ready()
    expect(inst.data.leftEmpty).toBe(true)
  })

  it('__checkLeftEmpty：探针缺失（插槽有内容）→ leftEmpty 复位 false', () => {
    const inst = mountDef(comp.def)
    inst.setData({leftEmpty: true})
    inst.ready()
    expect(inst.data.leftEmpty).toBe(false)
  })

  it('__checkLeftEmpty：exec 异步回调间隙图标已被设置 → 不回写 false（重查防御）', () => {
    const patches: Array<Record<string, unknown>> = []
    const fakeData = {icon: '', leftEmpty: true}
    comp.def.methods!.__checkLeftEmpty.call({
      data: fakeData,
      createSelectorQuery: () => ({
        select: () => ({boundingClientRect() { /* 探针注册 */ }}),
        exec(cb: (res: unknown[]) => void) {
          // 模拟真实异步：回调执行前 icon 已被并行设置
          fakeData.icon = 'volume'
          cb([null])
        },
      }),
      setData(patch: Record<string, unknown>) {
        Object.assign(fakeData, patch)
        patches.push(patch)
      },
    } as never)
    expect(patches).toEqual([])
  })

  it('__checkOverflow：非 scrollable 直接返回（resize 同样短路）', () => {
    const inst = mountDef(comp.def)
    inst.methods.resize.call(inst)
    expect(inst.data.measuring).toBe(false)
    expect(inst.data.overflow).toBe(false)
  })

  it('__checkOverflow：度量溢出 → overflow true，探测态样式度量后复原', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-notice-bar-content': {width: 100, left: 0},
        '.cu-notice-bar-content-inner': {width: 150, left: 0},
      },
    })
    inst.setData({scrollable: true}) // observer 触发探测
    vi.advanceTimersByTime(50)
    expect(inst.data.overflow).toBe(true)
    expect(inst.data.measuring).toBe(false)
    expect(inst.data.innerStyle).toBe('')
  })

  it('__checkOverflow：未溢出且与上次相同 → 跳过赋值直接复原', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-notice-bar-content': {width: 200, left: 0},
        '.cu-notice-bar-content-inner': {width: 100, left: 0},
      },
    })
    inst.setData({scrollable: true})
    vi.advanceTimersByTime(50)
    expect(inst.data.overflow).toBe(false)
    expect(inst.data.measuring).toBe(false)
  })

  it('__checkOverflow：包裹/内容节点缺失 → 直接复原不判定', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {rects: {'.cu-notice-bar-content': {width: 100, left: 0}}})
    inst.setData({scrollable: true})
    vi.advanceTimersByTime(50)
    expect(inst.data.measuring).toBe(false)
    expect(inst.data.overflow).toBe(false)
  })

  it('__checkOverflow：wrap.width 非数字 → 直接复原', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-notice-bar-content': {left: 0},
        '.cu-notice-bar-content-inner': {width: 10, left: 0},
      },
    })
    inst.setData({scrollable: true})
    vi.advanceTimersByTime(50)
    expect(inst.data.measuring).toBe(false)
  })

  it('__checkOverflow：度量回调时已取消 scrollable → 短路', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-notice-bar-content': {width: 100, left: 0},
        '.cu-notice-bar-content-inner': {width: 150, left: 0},
      },
    })
    inst.setData({scrollable: true})
    inst.setData({scrollable: false}) // 重挂定时器，但回调时 scrollable 已为 false
    vi.advanceTimersByTime(50)
    expect(inst.data.measuring).toBe(false)
  })

  it('__checkOverflow：度量进行中（measuring 冻结）→ 回调短路不重复探测', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-notice-bar-content': {width: 100, left: 0},
        '.cu-notice-bar-content-inner': {width: 150, left: 0},
      },
    })
    inst.setData({scrollable: true})
    inst.setData({measuring: true}) // 模拟上一轮度量未结束
    vi.advanceTimersByTime(50)
    expect(inst.data.measuring).toBe(true) // 早退未复原
  })

  it('resize：手动重测（插槽动态变化后调用）走完整探测链', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-notice-bar-content': {width: 100, left: 0},
        '.cu-notice-bar-content-inner': {width: 150, left: 0},
        '#cu-nb-left-probe': {height: 0},
      },
    })
    inst.setData({scrollable: true})
    inst.methods.resize.call(inst)
    vi.advanceTimersByTime(50)
    expect(inst.data.overflow).toBe(true)
    expect(inst.data.leftEmpty).toBe(true)
  })
})
