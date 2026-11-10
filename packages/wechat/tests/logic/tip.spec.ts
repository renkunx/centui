/**
 * tip 定位与类名测试（对照 Vue 版 Tip.vue layout() + TipContent.vue wrapperCls）
 * 以及 popup-title-bar 基础样式复刻（token 引用与字面量边界）。
 */
import {describe, it, expect} from 'vitest'
import {buildWrapperCls, computeTipStyle} from '../../src/components/tip/logic'
import {buildTitleBarStyles} from '../../src/components/popup-title-bar/logic'

const ref = {width: 100, height: 40, left: 200, top: 300}
const tip = {width: 120, height: 60}

describe('tip/computeTipStyle（Vue layout 公式，fixed 定位）', () => {
  it('top：y -= tipH + 10；x 居中', () => {
    const style = computeTipStyle('top', ref, tip, undefined, false)
    expect(style).toContain('position:fixed')
    expect(style).toContain(`top:${300 - 60 - 10}px`)
    expect(style).toContain(`left:${200 + (100 - 120) / 2}px`)
  })

  it('bottom：y += refH + 10；x 居中', () => {
    const style = computeTipStyle('bottom', ref, tip, undefined, false)
    expect(style).toContain(`top:${300 + 40 + 10}px`)
    expect(style).toContain(`left:${200 + (100 - 120) / 2}px`)
  })

  it('left：垂直居中；x -= tipW + 10', () => {
    const style = computeTipStyle('left', ref, tip, undefined, false)
    expect(style).toContain(`top:${300 + (40 - 60) / 2}px`)
    expect(style).toContain(`left:${200 - 120 - 10}px`)
  })

  it('right：垂直居中；x += refW + 10', () => {
    const style = computeTipStyle('right', ref, tip, undefined, false)
    expect(style).toContain(`top:${300 + (40 - 60) / 2}px`)
    expect(style).toContain(`left:${200 + 100 + 10}px`)
  })

  it('fill：top/bottom 撑宽、left/right 撑高（Vue fill 语义）', () => {
    expect(computeTipStyle('top', ref, tip, undefined, true)).toContain('width:100px;')
    expect(computeTipStyle('left', ref, tip, undefined, true)).toContain('height:40px;')
    expect(computeTipStyle('top', ref, tip, undefined, false)).not.toContain('width:')
  })

  it('offset.top/left 附加（Vue offsetTop/offsetLeft）', () => {
    const style = computeTipStyle('top', ref, tip, {top: 5, left: -3}, false)
    expect(style).toContain(`top:${300 - 70 + 5}px`)
    expect(style).toContain(`left:${200 - 10 - 3}px`)
  })
})

describe('tip/buildWrapperCls（TipContent wrapperCls）', () => {
  it('has-close + placement 修饰类（top 不加 is-）', () => {
    expect(buildWrapperCls(true, 'top', undefined)).toBe('has-close')
    expect(buildWrapperCls(true, 'bottom', undefined)).toBe('has-close is-bottom')
    expect(buildWrapperCls(false, 'left', undefined)).toBe('is-left')
    expect(buildWrapperCls(false, 'right', undefined)).toBe('is-right')
  })

  it('name 进入类名（Vue [String(props.name)]）', () => {
    expect(buildWrapperCls(true, 'top', 'tip-x')).toBe('has-close tip-x')
    expect(buildWrapperCls(false, 'top', 7)).toBe('7')
    expect(buildWrapperCls(false, 'top', '')).toBe('')
  })
})

describe('popup-title-bar/buildTitleBarStyles（popup.styl title-bar 段复刻）', () => {
  const base = {title: 'T', describe: '', largeRadius: false, onlyClose: false, titleAlign: 'center'}

  it('bar：height/bg/radius 全走 token；describe 存在时 large 档', () => {
    const styles = buildTitleBarStyles(base)
    expect(styles.barStyle).toContain('height:var(--popup-title-bar-height)')
    expect(styles.barStyle).toContain('background-color:var(--popup-title-bar-bg)')
    expect(styles.barStyle).toContain('var(--popup-title-bar-radius-large)')
    const large = buildTitleBarStyles({...base, describe: 'D'})
    expect(large.barStyle).toContain('height:var(--popup-title-bar-height-large)')
  })

  it('title/describe 字号色 token；describe margin-top 15rpx 字面量', () => {
    const styles = buildTitleBarStyles(base)
    expect(styles.titleStyle).toContain('font-size:var(--popup-title-bar-font-size-title)')
    expect(styles.titleStyle).toContain('color:var(--popup-title-bar-color-title)')
    expect(styles.describeStyle).toContain('margin-top:15rpx')
    expect(styles.describeStyle).toContain('font-size:var(--popup-title-bar-font-size-describe)')
    expect(styles.describeStyle).toContain('color:var(--popup-title-bar-color-describe)')
  })

  it('titleAlign left：左按钮隐藏、标题左对齐', () => {
    const styles = buildTitleBarStyles({...base, titleAlign: 'left'})
    expect(styles.leftStyle).toContain('display:none')
    expect(styles.titleWrapStyle).toContain('padding-left:var(--h-gap-sl)')
  })

  it('关闭格着色 token（.cu-popup-close）', () => {
    const styles = buildTitleBarStyles(base)
    expect(styles.closeStyle).toContain('color:var(--popup-title-bar-color-button-left)')
  })
})

// ---------------------------------------------------------------------------
// tip 组件实例（index.ts）：show/hide 生命周期、__layout 测量、命令式 Tip 工厂
// ---------------------------------------------------------------------------
import {beforeEach as b2, afterEach as a2, describe as d2, expect as e2, it as i2, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/tip/index'))
const {Tip} = (comp as unknown as {exports: {Tip: typeof import('../../src/components/tip/index')['Tip']}}).exports

b2(() => vi.useFakeTimers())
a2(() => vi.useRealTimers())

const RECTS = {
  '.cu-tip-root': {width: 100, height: 40, left: 200, top: 300},
  '.cu-tip-bubble': {width: 120, height: 60},
} as never

function mountTip(rects: unknown = RECTS) {
  const inst = mountDef(comp.def, {rects: rects as never})
  return inst
}

d2('tip show/hide', () => {
  i2('show()：visible/wrapperCls/show 事件，nextTick 测量后定位', async () => {
    const inst = mountTip()
    inst.methods.show.call(inst)
    e2(inst.data.visible).toBe(true)
    e2(inst.data.wrapperCls).toBe('has-close') // closable 默认 true、placement top、name ''
    e2(inst.data.layerStyle).toBe('')
    e2(inst.eventsOf('show')).toEqual([{name: 'show', detail: {name: ''}}])

    await vi.advanceTimersByTimeAsync(1) // wx.nextTick → 测量
    e2(inst.data.layerStyle).toContain('position:fixed')
    e2(inst.data.layerStyle).toContain(`top:${300 - 60 - 10}px`) // top：y -= tipH + 10
    e2(inst.data.layerStyle).toContain(`left:${200 + (100 - 120) / 2}px`)
  })

  i2('show(options)：serializable 覆盖 content/icon/placement/closable/fill/offset/name', async () => {
    const inst = mountTip()
    inst.methods.show.call(inst, {
      content: '提示', icon: 'safe', placement: 'bottom', closable: false,
      fill: true, offset: {top: 5, left: -3}, name: 'tip-x', ignored: 1,
    } as never)
    e2(inst.data.content).toBe('提示')
    e2((inst.data as {icon: string}).icon).toBe('safe')
    e2(inst.data.placement).toBe('bottom')
    e2(inst.data.closable).toBe(false)
    e2(inst.data.fill).toBe(true)
    e2(inst.data.offset).toEqual({top: 5, left: -3})
    e2((inst.data as {name: string}).name).toBe('tip-x')
    e2((inst.data as Record<string, unknown>).ignored).toBeUndefined() // 白名单外丢弃
    e2(inst.data.wrapperCls).toBe('is-bottom tip-x') // closable false → 无 has-close
    await vi.advanceTimersByTimeAsync(1)
    e2(inst.data.layerStyle).toContain('width:100px;') // fill + bottom → 撑宽
    e2(inst.data.layerStyle).toContain(`top:${300 + 40 + 10 + 5}px`)
    e2(inst.data.layerStyle).toContain(`left:${200 + (100 - 100) / 2 - 3}px`)
  })

  i2('show() 空参数：不写 serializable，直接可见', () => {
    const inst = mountTip()
    inst.methods.show.call(inst)
    e2(inst.data.visible).toBe(true)
  })

  i2('重复 show：再次派发 show 事件（Vue 语义）', () => {
    const inst = mountTip()
    inst.methods.show.call(inst)
    inst.methods.show.call(inst)
    e2(inst.eventsOf('show')).toHaveLength(2)
  })

  i2('hide()：visible 复位、layerStyle 清空、hide 事件', () => {
    const inst = mountTip()
    inst.methods.show.call(inst)
    inst.methods.hide.call(inst)
    e2(inst.data.visible).toBe(false)
    e2(inst.data.layerStyle).toBe('')
    e2(inst.eventsOf('hide')).toEqual([{name: 'hide', detail: {name: ''}}])
  })

  i2('hide()：未显示时早退（不派发）', () => {
    const inst = mountTip()
    inst.methods.hide.call(inst)
    e2(inst.events).toEqual([])
  })

  i2('hide 后 nextTick 测量早退（visible 已 false）', async () => {
    const inst = mountTip()
    inst.methods.show.call(inst)
    inst.methods.hide.call(inst)
    await vi.advanceTimersByTimeAsync(10)
    e2(inst.data.layerStyle).toBe('')
  })

  i2('__layout 测量失败：rect 全 null → 不定位', async () => {
    const inst = mountTip({'.cu-tip-root': null, '.cu-tip-bubble': null})
    inst.methods.show.call(inst)
    await vi.advanceTimersByTimeAsync(1)
    e2(inst.data.layerStyle).toBe('')
  })

  i2('测量后已 hide：不回填 layerStyle', async () => {
    const inst = mountTip()
    inst.methods.show.call(inst)
    // 白盒：在 exec 回调执行前置 visible=false（延迟 hide 语义模拟）
    const instAny = inst as unknown as {__tipState?: unknown}
    instAny.__tipState = {name: ''}
    ;(inst as unknown as {data: Record<string, unknown>}).data.visible = false
    await vi.advanceTimersByTimeAsync(1)
    e2(inst.data.layerStyle).toBe('')
  })

  i2('onTriggerTap/onClose 桥接与 noop', () => {
    const inst = mountTip()
    inst.methods.onTriggerTap.call(inst)
    e2(inst.data.visible).toBe(true)
    inst.methods.onClose.call(inst)
    e2(inst.data.visible).toBe(false)
    e2(() => inst.methods.noop.call(inst)).not.toThrow()
  })
})

d2('tip 命令式工厂（Tip / Tip.hide）', () => {
  i2('Tip(ctx, content, options)：定位组件并注入 content', () => {
    const inst = mountTip()
    const ctx = {selectComponent: (sel: string) => (sel === '#cu-tip' ? inst : null)}
    const ret = Tip(ctx as never, '气泡内容', {placement: 'right'})
    e2(ret).toBe(inst)
    e2(inst.data.content).toBe('气泡内容')
    e2(inst.data.placement).toBe('right')
    e2(inst.data.visible).toBe(true)
    e2(inst.data.wrapperCls).toBe('has-close is-right')
  })

  i2('Tip.hide(ctx)：调用组件 hide；未显示早退', () => {
    const inst = mountTip()
    inst.methods.show.call(inst)
    const ctx = {selectComponent: () => inst}
    Tip.hide(ctx as never)
    e2(inst.data.visible).toBe(false)
    e2(inst.eventsOf('hide')).toHaveLength(1)
  })

  i2('Tip 自定义 selector', () => {
    const inst = mountTip()
    const seen: string[] = []
    const ctx = {selectComponent: (sel: string) => { seen.push(sel); return inst }}
    Tip(ctx as never, 'x', {}, '#other-tip')
    Tip.hide(ctx as never, '#other-hide')
    e2(seen).toEqual(['#other-tip', '#other-hide'])
  })

  i2('未找到组件：console.warn 且不崩溃', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ctx = {selectComponent: () => null}
    e2(Tip(ctx as never, 'x')).toBeNull()
    e2(() => Tip.hide(ctx as never)).not.toThrow()
    e2(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})
