/**
 * toast 逻辑层测试（对照 Vue 版 test/components/toast.spec.ts 行为清单）：
 * 1. show/hide 控制 visible；duration>0 到时自动隐藏（定时器真源）
 * 2. show(props) 白名单合并（未传键保留组件当前值）
 * 3. 命令式工厂：resolve selectComponent、info/succeed/failed/loading 预设、
 *    Toast.clear 别名、容器缺失告警
 * 4. loading 预设 duration=0 不自动隐藏
 */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/toast/index'))
const {Toast} = comp.exports as {Toast: any}

function makeToast(props: Record<string, unknown> = {}, timers = true): Mounted {
  const inst = mountDef(comp.def, {props})
  inst.attached()
  if (timers) return inst
  return inst
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('toast 组件实例', () => {
  it('默认隐藏；show/hide 控制 visible', () => {
    const inst = makeToast({content: '提示', duration: 1000})
    expect(inst.data.visible).toBe(false)

    inst.methods.show.call(inst)
    expect(inst.data.visible).toBe(true)

    inst.methods.hide.call(inst)
    expect(inst.data.visible).toBe(false)
  })

  it('duration>0：show 后到时自动隐藏', () => {
    const inst = makeToast({duration: 0})
    inst.methods.show.call(inst, {duration: 1000})
    expect(inst.data.duration).toBe(1000)
    vi.advanceTimersByTime(999)
    expect(inst.data.visible).toBe(true)
    vi.advanceTimersByTime(1)
    expect(inst.data.visible).toBe(false)
  })

  it('duration=0（loading 语义）：不自动隐藏', () => {
    const inst = makeToast()
    inst.methods.show.call(inst, {content: '加载中', duration: 0})
    vi.advanceTimersByTime(10000)
    expect(inst.data.visible).toBe(true)
  })

  it('show(props) 白名单合并：未传键保留当前值', () => {
    const inst = makeToast({content: '默认', position: 'top', square: true})
    inst.methods.show.call(inst, {content: '覆盖'})
    expect(inst.data.content).toBe('覆盖')
    expect(inst.data.position).toBe('top')
    expect(inst.data.square).toBe(true)
  })

  it('连续 show 重置自动隐藏定时器（clearAll 后重排）', () => {
    const inst = makeToast()
    inst.methods.show.call(inst, {duration: 1000})
    vi.advanceTimersByTime(600)
    inst.methods.show.call(inst, {duration: 1000})
    vi.advanceTimersByTime(600)
    expect(inst.data.visible).toBe(true)
    vi.advanceTimersByTime(400)
    expect(inst.data.visible).toBe(false)
  })

  it('detached 清理定时器：隐藏回调不再执行', () => {
    const inst = makeToast()
    inst.methods.show.call(inst, {duration: 500})
    inst.detached()
    vi.advanceTimersByTime(1000)
    expect(inst.data.visible).toBe(true)
  })

  it('show/hide 事件经 popup 透传通道由 wxml 触发', () => {
    const inst = makeToast()
    inst.methods.onPopupShow.call(inst)
    inst.methods.onPopupHide.call(inst)
    expect(inst.events.map((e) => e.name)).toEqual(['show', 'hide'])
  })
})

describe('toast 命令式工厂', () => {
  function makePage(inst: Mounted | null) {
    return {selectComponent: () => inst}
  }

  it('Toast() 定位容器并 show(props)', () => {
    const inst = makeToast()
    const show = vi.spyOn(inst as never, 'show' as never)
    const page = makePage(inst)
    const ret = Toast(page, {content: '工厂提示', duration: 0})
    expect(ret).toBe(inst)
    expect(show).toHaveBeenCalledWith({content: '工厂提示', duration: 0})
  })

  it('info 预设：无图标、duration 3000', () => {
    const inst = makeToast()
    const page = makePage(inst)
    Toast.info(page, '已保存')
    expect(inst.data.visible).toBe(true)
    expect(inst.data.content).toBe('已保存')
    expect(inst.data.icon).toBe('')
    expect(inst.data.duration).toBe(3000)
    expect(inst.data.hasMask).toBe(false)
  })

  it('succeed/failed 预设图标', () => {
    const inst = makeToast()
    const page = makePage(inst)
    Toast.succeed(page, '成功')
    expect(inst.data.icon).toBe('success')
    Toast.failed(page, '失败')
    expect(inst.data.icon).toBe('fail')
  })

  it('loading 预设：spinner + duration 0 + hasMask，clear 关闭', () => {
    const inst = makeToast()
    const page = makePage(inst)
    Toast.loading(page, '加载中')
    expect(inst.data.icon).toBe('spinner')
    expect(inst.data.duration).toBe(0)
    expect(inst.data.hasMask).toBe(true)
    vi.advanceTimersByTime(10000)
    expect(inst.data.visible).toBe(true)
    Toast.clear(page)
    expect(inst.data.visible).toBe(false)
  })

  it('info 自定义 duration：到时自动隐藏', () => {
    const inst = makeToast()
    const page = makePage(inst)
    Toast.info(page, '自动关闭', 1500)
    vi.advanceTimersByTime(1500)
    expect(inst.data.visible).toBe(false)
  })

  it('Toast.hide = Toast.clear 别名', () => {
    expect(Toast.hide).toBe(Toast.clear)
  })

  it('容器缺失：告警且不崩溃', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const page = makePage(null)
      expect(() => Toast.info(page, '无容器')).not.toThrow()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('cu-toast'))
    } finally {
      warn.mockRestore()
    }
  })

  it('自定义 selector 覆盖', () => {
    const inst = makeToast()
    const seen: string[] = []
    const page = {selectComponent: (sel: string) => (seen.push(sel), inst)}
    Toast(page, {content: 'x'}, '#my-toast')
    expect(seen).toEqual(['#my-toast'])
  })
})
