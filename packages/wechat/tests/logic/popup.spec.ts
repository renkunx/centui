/**
 * popup 逻辑层测试（对照 Vue 版 test/components/popup.spec.ts 行为清单 + 弹层状态机）：
 * 1. show=true → 进场四段类（enter → 双帧后 enter-active → 300ms 后清理），
 *    beforeShow 在过渡启动、show 在定时器回调
 * 2. show=false → 离场，hide 启动即 emit change(false)，250ms 后 hide
 * 3. position → 默认过渡名；transition 覆盖
 * 4. 遮罩点击：maskClosable 才触发隐藏 + maskClick
 * 5. attached 初始 show=true 直接打开
 */
import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/popup/index'))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function enter(names: string) {
  return `cu-${names}-enter cu-${names}-enter-active`
}

describe('popup 进场', () => {
  it('show=true：isShown 立即、enter 起始类、beforeShow；300ms 后 show 且类清理', async () => {
    const inst = mountDef(comp.def, {props: {position: 'center'}})
    inst.attached()

    inst.setData({show: true})
    expect(inst.data.isShown).toBe(true)
    expect(inst.data.boxShown).toBe(true)
    expect(inst.data.boxCls).toBe(enter('fade'))
    expect(inst.data.maskCls).toBe(enter('mask-fade'))
    expect(inst.eventsOf('beforeShow')).toHaveLength(1)
    expect(inst.eventsOf('show')).toHaveLength(0)

    // 双 wx.nextTick 后起始类移除、进入 active 段
    await vi.advanceTimersByTimeAsync(1)
    expect(inst.data.boxCls).toBe('cu-fade-enter-active')
    expect(inst.data.maskCls).toBe('cu-mask-fade-enter-active')

    await vi.advanceTimersByTimeAsync(300)
    expect(inst.data.boxCls).toBe('')
    expect(inst.eventsOf('show')).toHaveLength(1)
  })

  it('position=bottom 默认 slide-up 过渡', async () => {
    const inst = mountDef(comp.def, {props: {position: 'bottom'}})
    inst.attached()
    inst.setData({show: true})
    expect(inst.data.boxCls).toBe(enter('slide-up'))
    await vi.advanceTimersByTimeAsync(300)
    expect(inst.eventsOf('show')).toHaveLength(1)
  })

  it('transition 属性覆盖默认过渡名', () => {
    const inst = mountDef(comp.def, {props: {position: 'bottom', transition: 'zoom'}})
    inst.attached()
    expect(inst.data.transitionName).toBe('zoom')
  })

  it('attached 初始 show=true 直接打开（对齐 Vue onMounted）', async () => {
    const inst = mountDef(comp.def, {props: {show: true, position: 'top'}})
    inst.attached()
    expect(inst.data.isShown).toBe(true)
    expect(inst.eventsOf('beforeShow')).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(300)
    expect(inst.eventsOf('show')).toHaveLength(1)
  })
})

describe('popup 离场', () => {
  it('show=false：leave 类 + beforeHide + change(false)；250ms 后 hide 且节点隐藏', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    await vi.advanceTimersByTimeAsync(300)

    inst.setData({show: false})
    expect(inst.data.boxCls).toBe('cu-fade-leave-to cu-fade-leave-active')
    expect(inst.eventsOf('beforeHide')).toHaveLength(1)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: false}}])

    await vi.advanceTimersByTimeAsync(250)
    expect(inst.data.isShown).toBe(false)
    expect(inst.data.boxShown).toBe(false)
    expect(inst.eventsOf('hide')).toHaveLength(1)
  })

  it('未显示时 show=false 不派发任何事件', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: false})
    expect(inst.events).toEqual([])
  })
})

describe('popup 动画锁', () => {
  it('离场动画期间再次 show：50ms 重试重进场，被中断的 leave 不再收尾（Vue 中断语义）', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    await vi.advanceTimersByTimeAsync(300)
    expect(inst.eventsOf('show')).toHaveLength(1)

    inst.setData({show: false}) // 离场启动（beforeHide + change(false)）
    inst.setData({show: true}) // 离场进行中 → 50ms 重试
    await vi.advanceTimersByTimeAsync(50)
    expect(inst.data.isShown).toBe(true)

    await vi.advanceTimersByTimeAsync(300)
    // 被中断的 leave 不触发 hide（对齐 Vue：after-leave 在中断时不调用）
    expect(inst.eventsOf('hide')).toHaveLength(0)
    expect(inst.eventsOf('show')).toHaveLength(2)
    expect(inst.data.isShown).toBe(true)
  })
})

describe('popup 遮罩', () => {
  it('maskClosable：遮罩点击隐藏 + maskClick', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    await vi.advanceTimersByTimeAsync(300)

    inst.methods.onMaskTap.call(inst)
    expect(inst.eventsOf('maskClick')).toHaveLength(1)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: false}}])
    await vi.advanceTimersByTimeAsync(250)
    expect(inst.data.isShown).toBe(false)
  })

  it('maskClosable=false：遮罩点击无 maskClick/change（show 流程事件除外）', async () => {
    const inst = mountDef(comp.def, {props: {maskClosable: false}})
    inst.attached()
    inst.setData({show: true})
    await vi.advanceTimersByTimeAsync(300)
    inst.methods.onMaskTap.call(inst)
    expect(inst.eventsOf('maskClick')).toHaveLength(0)
    expect(inst.eventsOf('change')).toHaveLength(0)
    expect(inst.eventsOf('hide')).toHaveLength(0)
  })
})

describe('popup 其他', () => {
  it('setLargeRadius 由 popup-title-bar 经 relations 回写', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.setLargeRadius.call(inst, true)
    expect(inst.data.largeRadius).toBe(true)
  })

  it('detached 清理全部定时器：show 不再派发', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    inst.detached()
    await vi.advanceTimersByTimeAsync(1000)
    expect(inst.eventsOf('show')).toHaveLength(0)
  })
})
