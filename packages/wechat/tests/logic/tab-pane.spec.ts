/**
 * tab-pane 逻辑层测试（对照 Vue 版 TabPane.vue + rootTabs 通道）：
 * 1. setActive(true)：enter 起始类 → 双帧 active → 300ms 清理（v-show 语义保持挂载）
 * 2. setActive(false)：曾有激活 → leave 类 → 300ms 后隐藏；从未激活 → 立即隐藏
 * 3. label/disabled observer → 父 tabs syncPanes（对齐 rootTabs.forceUpdate）
 * 4. relations 登记父实例
 */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/tab-pane/index'))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('tab-pane 激活过渡', () => {
  it('setActive(true)：active 立即、enter 起始类 → active 段 → 300ms 清理', async () => {
    const inst = mountDef(comp.def)
    inst.attached()

    inst.methods.setActive.call(inst, true, 'cu-tab-slide-left')
    expect(inst.data.active).toBe(true)
    expect(inst.data.paneCls).toBe(
      'cu-tab-slide-left-enter cu-tab-slide-left-enter-active',
    )

    await vi.advanceTimersByTimeAsync(1)
    expect(inst.data.paneCls).toBe('cu-tab-slide-left-enter-active')

    await vi.advanceTimersByTimeAsync(300)
    expect(inst.data.paneCls).toBe('')
  })

  it('setActive(false)（曾激活）：leave 类 → 300ms 后隐藏', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.setActive.call(inst, true, 'cu-tab-slide-right')
    await vi.advanceTimersByTimeAsync(300)

    inst.methods.setActive.call(inst, false, 'cu-tab-slide-right')
    expect(inst.data.active).toBe(true) // v-show：过渡期保持挂载
    expect(inst.data.paneCls).toBe(
      'cu-tab-slide-right-leave-to cu-tab-slide-right-leave-active',
    )

    await vi.advanceTimersByTimeAsync(300)
    expect(inst.data.active).toBe(false)
    expect(inst.data.paneCls).toBe('')
  })

  it('setActive(false)（从未激活）：立即隐藏无过渡', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.setActive.call(inst, false, 'cu-tab-slide-left')
    expect(inst.data.active).toBe(false)
    expect(inst.data.paneCls).toBe('')
    await vi.advanceTimersByTimeAsync(300)
    expect(inst.data.active).toBe(false)
  })

  it('切换中断：clearAll 旧定时器后重新过渡', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.setActive.call(inst, true, 'cu-tab-slide-left')
    await vi.advanceTimersByTimeAsync(300)
    inst.methods.setActive.call(inst, false, 'cu-tab-slide-left')
    await vi.advanceTimersByTimeAsync(100)
    inst.methods.setActive.call(inst, true, 'cu-tab-slide-left')
    expect(inst.data.paneCls).toContain('-enter')
    await vi.advanceTimersByTimeAsync(1) // 冲洗双帧回调
    await vi.advanceTimersByTimeAsync(300)
    expect(inst.data.paneCls).toBe('')
    expect(inst.data.active).toBe(true)
  })

  it('detached 清理定时器：清理后 enter 清理类回调不再执行', async () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.setActive.call(inst, true, 'cu-tab-slide-left')
    await vi.advanceTimersByTimeAsync(1) // enter 起始类 → active 段，300ms 清理回调已排程
    inst.detached()
    await vi.advanceTimersByTimeAsync(1000)
    expect(inst.data.paneCls).toBe('cu-tab-slide-left-enter-active')
  })
})

describe('tab-pane 父协同', () => {
  it('relations linked：登记父 tabs 实例', async () => {
    const inst = mountDef(comp.def)
    const parent = {syncPanes: vi.fn()}
    inst.linkRelation('../tabs/index', parent)
    expect((inst as unknown as {__tabs: unknown}).__tabs).toBe(parent)
  })

  it('label/disabled 变更 → 父 syncPanes（对齐 rootTabs.forceUpdate）', async () => {
    const syncPanes = vi.fn()
    const inst = mountDef(comp.def)
    inst.linkRelation('../tabs/index', {syncPanes})
    inst.setData({label: '新标签'})
    inst.setData({disabled: true})
    expect(syncPanes).toHaveBeenCalledTimes(2)
  })

  it('unlinked：解除后 label 变更不再通知', async () => {
    const syncPanes = vi.fn()
    const inst = mountDef(comp.def)
    inst.linkRelation('../tabs/index', {syncPanes})
    const rel = comp.def.relations!['../tabs/index']
    rel.unlinked!.call(inst)
    inst.setData({label: 'x'})
    expect(syncPanes).not.toHaveBeenCalled()
  })

  it('未入组时 label 变更不崩溃', async () => {
    const inst = mountDef(comp.def)
    expect(() => inst.setData({label: 'x'})).not.toThrow()
  })
})
