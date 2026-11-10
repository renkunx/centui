/**
 * transition 逻辑层测试（对齐 popup 状态机约定）：
 * 1. 过渡名规范化：剥 'cu-' 前缀、空值回退 'fade'
 * 2. show=true/false 四段类序列与 show/hide 事件（定时器真源）
 * 3. 未知过渡名时长 0 → 立即完成
 * 4. attached 初始 show=true 直接呈现、不播入场动画（无 appear 语义）
 */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/transition/index'))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('transition 过渡名', () => {
  it("observer：'cu-slide-up' 剥前缀为 'slide-up'", async () => {
    const inst = mountDef(comp.def, {props: {name: 'cu-slide-up'}})
    inst.attached()
    expect(inst.data.transitionName).toBe('slide-up')
  })

  it('空名回退 fade', async () => {
    const inst = mountDef(comp.def, {props: {name: ''}})
    inst.attached()
    expect(inst.data.transitionName).toBe('fade')
  })

  it('缺省 fade', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.transitionName).toBe('fade')
  })
})

describe('transition 进出场', () => {
  it('show=true：enter 起始类 → active → 300ms 后清理 + show 事件', async () => {
    const inst = mountDef(comp.def, {props: {name: 'zoom'}})
    inst.attached()

    inst.setData({show: true})
    expect(inst.data.isShown).toBe(true)
    expect(inst.data.cls).toBe('cu-zoom-enter cu-zoom-enter-active')
    expect(inst.eventsOf('beforeShow')).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(inst.data.cls).toBe('cu-zoom-enter-active')

    await vi.advanceTimersByTimeAsync(300)
    expect(inst.data.cls).toBe('')
    expect(inst.eventsOf('show')).toHaveLength(1)
  })

  it('show=false：leave 类 → 250ms 后隐藏 + hide 事件', async () => {
    const inst = mountDef(comp.def, {props: {name: 'zoom'}})
    inst.attached()
    inst.setData({show: true})
    await vi.advanceTimersByTimeAsync(300)

    inst.setData({show: false})
    expect(inst.data.cls).toBe('cu-zoom-leave-to cu-zoom-leave-active')
    expect(inst.eventsOf('beforeHide')).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(250)
    expect(inst.data.isShown).toBe(false)
    expect(inst.eventsOf('hide')).toHaveLength(1)
  })

  it('未显示时 show=false 不派发', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: false})
    expect(inst.events).toEqual([])
  })

  it('未知过渡名：时长 0 → show 立即到达（无动画直达终态）', async () => {
    const inst = mountDef(comp.def, {props: {name: 'no-such-transition'}})
    inst.attached()
    inst.setData({show: true})
    await vi.advanceTimersByTimeAsync(1)
    expect(inst.data.cls).toBe('')
    expect(inst.eventsOf('show')).toHaveLength(1)
  })
})

describe('transition 生命周期', () => {
  it('attached 初始 show=true 直接呈现，不播入场动画', async () => {
    const inst = mountDef(comp.def, {props: {show: true}})
    inst.attached()
    expect(inst.data.isShown).toBe(true)
    expect(inst.data.cls).toBe('')
    expect(inst.events).toEqual([])
  })

  it('动画期间再次 show：50ms 重试重进场，被中断的 leave 不再收尾', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    inst.setData({show: false})
    inst.setData({show: true}) // 离场进行中 → 50ms 重试
    await vi.advanceTimersByTimeAsync(50)
    expect(inst.data.isShown).toBe(true)
    // 被中断的 leave 不触发 hide（对齐 Vue：after-leave 在中断时不调用）
    await vi.advanceTimersByTimeAsync(300)
    expect(inst.eventsOf('hide')).toHaveLength(0)
    expect(inst.eventsOf('show')).toHaveLength(1)
    expect(inst.data.isShown).toBe(true)
  })

  it('detached 清理定时器', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    inst.detached()
    await vi.advanceTimersByTimeAsync(1000)
    expect(inst.eventsOf('show')).toHaveLength(0)
  })
})
