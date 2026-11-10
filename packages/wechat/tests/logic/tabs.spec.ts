/**
 * tabs 纯逻辑测试：ink bar 几何、自动滚动目标、渐变遮罩可见性。
 * 对照 Vue 版 TabBar.vue 的 reflow/onScroll。
 */
import {describe, it, expect} from 'vitest'
import {inkGeometryOf, maskVisibilityOf, scrollTargetOf, type ItemRect} from '../../src/components/tabs/logic'

const rects: ItemRect[] = [
  {left: 0, width: 80},
  {left: 80, width: 120},
  {left: 200, width: 90},
]

describe('tabs/logic ink 几何', () => {
  it('inkLength 百分比：宽度 = 激活项宽度 × n/100，居中定位', () => {
    const ink = inkGeometryOf(rects[1], 25)
    expect(ink.width).toBe(30) // 120 × 25%
    expect(ink.pos).toBe(80 + (120 - 30) / 2)
  })

  it('inkLength 字符串直接作 px', () => {
    const ink = inkGeometryOf(rects[0], '40')
    expect(ink.width).toBe(40)
    expect(ink.pos).toBe(20)
  })

  it('inkLength 100 铺满激活项', () => {
    const ink = inkGeometryOf(rects[2], 100)
    expect(ink.width).toBe(90)
    expect(ink.pos).toBe(200)
  })
})

describe('tabs/logic 自动滚动目标（TabBar.reflow 尾段）', () => {
  it('无前项 → 0；无后项 → contentW - wrapperW', () => {
    expect(scrollTargetOf(0, rects, 290, 200)).toBe(0)
    expect(scrollTargetOf(2, rects, 290, 200)).toBe(90)
    expect(scrollTargetOf(2, rects, 290, 300)).toBe(0) // wrapper 更宽不滚
  })

  it('前项滚出视口左缘 → 滚到前项 offset', () => {
    // 当前滚动位 100，前项 left 0 已滚出 → 回滚到 0
    expect(scrollTargetOf(1, rects, 290, 200, 100)).toBe(0)
    const tight: ItemRect[] = [
      {left: 0, width: 80},
      {left: 80, width: 70},
      {left: 150, width: 70},
      {left: 220, width: 60},
    ]
    // 前后项均贴近视口（80 >= 80，右缘 280 <= 80+200）→ 保持
    expect(scrollTargetOf(2, tight, 280, 200, 80)).toBeNull()
    // 前项滚出（80 < 100）→ 回滚到前项 offset
    expect(scrollTargetOf(2, tight, 280, 200, 100)).toBe(80)
  })

  it('后项滚出视口右缘 → 后项右缘对齐', () => {
    // 视口 [0,150]，后项右缘 390 > 150 → 滚动 240
    const shifted: ItemRect[] = [
      {left: 0, width: 80},
      {left: 80, width: 120},
      {left: 200, width: 90},
      {left: 290, width: 100},
    ]
    expect(scrollTargetOf(2, shifted, 390, 150)).toBe(240)
  })

  it('前后项均在视口内 → 保持当前滚动（null）', () => {
    const wide: ItemRect[] = [
      {left: 0, width: 60},
      {left: 60, width: 60},
      {left: 120, width: 60},
    ]
    expect(scrollTargetOf(1, wide, 180, 300)).toBeNull()
  })
})

describe('tabs/logic 渐变遮罩可见性', () => {
  it('滚动后显示起始遮罩；触底隐藏结束遮罩', () => {
    expect(maskVisibilityOf(0, 400, 300)).toEqual({start: false, end: true})
    expect(maskVisibilityOf(50, 400, 300)).toEqual({start: true, end: true})
    expect(maskVisibilityOf(100, 400, 300)).toEqual({start: true, end: false})
  })
})

// ---------------------------------------------------------------------------
// tabs 组件实例（index.ts）：relations 面板注册/分发、value observer、onItemTap、
// reflow 几何、onBarScroll、immediate、detached
// ---------------------------------------------------------------------------
import {beforeEach as b2, afterEach as a2, describe as d2, expect as e2, it as i2, vi} from 'vitest'
import {loadComponent, mountDef, tapEvent, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/tabs/index'))
const compPane = await loadComponent(() => import('../../src/components/tab-pane/index'))

b2(() => vi.useFakeTimers())
a2(() => vi.useRealTimers())

function makePane(name: string, label = name, disabled = false) {
  const p = mountDef(compPane.def, {props: {name, label, disabled}})
  p.attached()
  return p
}

function stateOf(inst: Mounted) {
  return (inst as unknown as {__tabs: {panes: unknown[]; prevIndex: number; immediateFired: boolean}}).__tabs
}

/** 覆盖实例的 createSelectorQuery：按序回放 select/selectAll 结果 */
function installQuery(inst: Mounted, provide: () => unknown[]) {
  ;(inst as unknown as Record<string, unknown>).createSelectorQuery = () => {
    const ordered = provide()
    const collected: unknown[] = []
    let i = 0
    const grab = () => (i < ordered.length ? ordered[i++] : null)
    const top = {
      select(_sel: string) {
        return {
          boundingClientRect(cb?: (r: unknown) => void) {
            const r = grab()
            collected.push(r)
            cb?.(r)
            return top
          },
        }
      },
      selectAll(_sel: string) {
        return {
          boundingClientRect(cb?: (r: unknown) => void) {
            const r = grab()
            collected.push(r)
            cb?.(r)
            return top
          },
        }
      },
      exec(done?: (res: unknown[]) => void) {
        done?.(collected)
        return top
      },
    }
    return top
  }
}

const BAR_RECTS = () => [
  {width: 200, left: 0}, // wrapper
  {width: 290, left: 0}, // content
  [{left: 0, width: 80}, {left: 80, width: 120}, {left: 200, width: 90}], // items
]

d2('tabs 面板注册与分发', () => {
  i2('linked：登记 pane + syncPanes（默认首项 + 分发激活）', () => {
    const a = makePane('a', 'Alpha')
    const b = makePane('b', 'Beta')
    const inst = mountDef(comp.def)
    inst.attached()
    inst.linkRelation('../tab-pane/index', a)
    e2(inst.data.items).toEqual([{name: 'a', label: 'Alpha', disabled: false, no: 0}])
    e2(inst.data.currentName).toBe('a') // 未指定 value → 默认首项（静默）
    e2(inst.data.currentIndex).toBe(0)
    e2(a.data.active).toBe(true)
    inst.linkRelation('../tab-pane/index', b)
    e2(inst.data.items).toHaveLength(2)
    e2(a.data.active).toBe(true)
    e2(b.data.active).toBe(false)
    e2(stateOf(inst).panes).toHaveLength(2)
  })

  i2('linked 去重：同一 pane 重复登记不重复', () => {
    const a = makePane('a')
    const inst = mountDef(comp.def)
    inst.attached()
    inst.linkRelation('../tab-pane/index', a)
    inst.linkRelation('../tab-pane/index', a)
    e2(stateOf(inst).panes).toHaveLength(1)
  })

  i2('unlinked：移除 pane 并重算 items', () => {
    const a = makePane('a')
    const inst = mountDef(comp.def)
    inst.attached()
    inst.linkRelation('../tab-pane/index', a)
    const rel = comp.def.relations!['../tab-pane/index']
    rel.unlinked!.call(inst, a as never)
    e2(inst.data.items).toEqual([])
    e2(stateOf(inst).panes).toHaveLength(0)
  })

  i2('syncPanes：pane 无 setActive / data 缺失的防御分支', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.linkRelation('../tab-pane/index', {} as never) // 无 setActive
    inst.linkRelation('../tab-pane/index', mountDef(compPane.def) as never) // 无 name/label
    e2(inst.data.items).toEqual([
      {name: '', label: '', disabled: false, no: 0},
      {name: '', label: '', disabled: false, no: 1},
    ])
  })

  i2('syncPanes：currentName 已设置时不覆盖默认（currentIndex 不重算）', () => {
    const a = makePane('a')
    const b = makePane('b')
    const inst = mountDef(comp.def)
    inst.attached()
    installQuery(inst, BAR_RECTS)
    inst.setData({value: 'b'}) // observer → currentName 'b'
    inst.linkRelation('../tab-pane/index', a)
    inst.linkRelation('../tab-pane/index', b)
    e2(inst.data.currentName).toBe('b')
    e2(inst.data.currentIndex).toBe(0) // syncPanes 不重算 index（分发用 __indexOf 现算）
    e2(b.data.active).toBe(true)
  })
})

d2('tabs value observer 与切换', () => {
  i2('value observer：currentName/currentIndex 更新 + 分发方向（prev>cur → right）', async () => {
    const a = makePane('a')
    const b = makePane('b')
    const c = makePane('c')
    const inst = mountDef(comp.def)
    inst.attached()
    installQuery(inst, BAR_RECTS) // 切换会排程 0ms reflow
    inst.linkRelation('../tab-pane/index', a)
    inst.linkRelation('../tab-pane/index', b)
    inst.linkRelation('../tab-pane/index', c)

    inst.setData({value: 'c'}) // 0 → 2：prevIndex 0 < 2 → left
    e2(inst.data.currentName).toBe('c')
    e2(inst.data.currentIndex).toBe(2)
    e2(c.data.active).toBe(true)
    e2(a.data.active).toBe(true) // v-show：leave 过渡期保持挂载
    e2(b.data.active).toBe(false) // 从未激活 → 立即隐藏

    inst.setData({value: 'a'}) // 2 → 0：prevIndex 2 > 0 → right
    e2(a.data.paneCls).toContain('cu-tab-slide-right')
    await vi.advanceTimersByTimeAsync(400) // 冲洗 leave/enter 过渡
    e2(a.data.active).toBe(true)
    e2(c.data.active).toBe(false)
  })

  i2('__indexOf：未知名回退 0', () => {
    const a = makePane('a')
    const inst = mountDef(comp.def)
    inst.attached()
    inst.linkRelation('../tab-pane/index', a)
    inst.setData({value: 'ghost'})
    e2(inst.data.currentIndex).toBe(0)
  })

  i2('onItemTap：change 载荷 + 分发；disabled/越界早退', async () => {
    const a = makePane('a')
    const b = makePane('b', 'Beta', true)
    const inst = mountDef(comp.def)
    inst.attached()
    installQuery(inst, BAR_RECTS) // syncPanes 0ms reflow 需要 selectAll 桩
    inst.linkRelation('../tab-pane/index', a)
    inst.linkRelation('../tab-pane/index', b)
    await vi.advanceTimersByTimeAsync(1)
    inst.events.length = 0

    inst.methods.onItemTap.call(inst, tapEvent({index: 1}) as never) // disabled
    e2(inst.events).toEqual([])

    inst.methods.onItemTap.call(inst, tapEvent({index: 9}) as never) // 越界
    e2(inst.events).toEqual([])

    inst.methods.onItemTap.call(inst, tapEvent({index: 0}) as never)
    e2(inst.eventsOf('change')).toEqual([
      {
        name: 'change',
        detail: {value: 'a', tab: {name: 'a', label: 'a', disabled: false}, index: 0, prevIndex: 0},
      },
    ])
    e2(inst.data.currentName).toBe('a')
    await vi.advanceTimersByTimeAsync(1)
  })
})

d2('tabs reflow 几何', () => {
  i2('items 为空：早退不查询', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    const spy = vi.spyOn(inst, 'createSelectorQuery')
    inst.methods.reflowTabBar.call(inst)
    e2(spy).not.toHaveBeenCalled()
  })

  i2('量取完整：ink/scrollable/scrollLeft/mask 全量回写', async () => {
    const a = makePane('a')
    const inst = mountDef(comp.def, {props: {inkLength: 25}})
    inst.attached()
    installQuery(inst, BAR_RECTS)
    inst.linkRelation('../tab-pane/index', a)
    await vi.advanceTimersByTimeAsync(1) // syncPanes 0ms reflow
    e2(inst.data.contentWidth).toBe(290)
    e2(inst.data.wrapperWidth).toBe(200)
    e2(inst.data.scrollable).toBe(true)
    e2(inst.data.inkStyle).toBe('width: 20px; transform: translateX(30px);')
    e2(inst.data.scrollLeft).toBe(0)
    e2(inst.data.maskStartShown).toBe(false)
    e2(inst.data.maskEndShown).toBe(true)
  })

  i2('inkLength 字符串（px）与 hasInk=false；hasInk=false 时不写 inkStyle', async () => {
    const a = makePane('a')
    const inst = mountDef(comp.def, {props: {inkLength: '40' as never, hasInk: false}})
    inst.attached()
    installQuery(inst, BAR_RECTS)
    inst.linkRelation('../tab-pane/index', a)
    await vi.advanceTimersByTimeAsync(1)
    e2(inst.data.inkStyle).toBe('')
  })

  i2('量取失败（wrapper/content/items null）→ 不回写', async () => {
    const a = makePane('a')
    const inst = mountDef(comp.def)
    inst.attached()
    installQuery(inst, () => [null, null, null])
    inst.linkRelation('../tab-pane/index', a)
    await vi.advanceTimersByTimeAsync(1)
    e2(inst.data.contentWidth).toBe(0)
  })

  i2('激活项越界（current 无 rect）→ 跳过 ink，但 scrollable/mask 仍回写', async () => {
    const a = makePane('a')
    const inst = mountDef(comp.def)
    inst.attached()
    installQuery(inst, BAR_RECTS)
    inst.linkRelation('../tab-pane/index', a)
    inst.setData({currentIndex: 5})
    await vi.advanceTimersByTimeAsync(1)
    e2(inst.data.inkStyle).toBe('')
    e2(inst.data.scrollable).toBe(true)
  })

  i2('自动滚动：后项滚出视口 → scrollLeft 对齐后项右缘', async () => {
    const a = makePane('a')
    const inst = mountDef(comp.def)
    inst.attached()
    installQuery(inst, () => [
      {width: 150, left: 0},
      {width: 390, left: 0},
      [{left: 0, width: 80}, {left: 80, width: 120}, {left: 200, width: 90}, {left: 290, width: 100}],
    ])
    inst.linkRelation('../tab-pane/index', a)
    inst.setData({currentIndex: 2})
    await vi.advanceTimersByTimeAsync(1)
    e2(inst.data.scrollLeft).toBe(240)
    // mask 以更新前的 scrollLeft（0）计算：contentW 390 > wrapperW 150 → end 显示
    e2(inst.data.maskEndShown).toBe(true)
  })
})

d2('tabs onBarScroll / immediate / detached', () => {
  i2('onBarScroll：遮罩随滚动位翻转', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({contentWidth: 400, wrapperWidth: 300})
    inst.methods.onBarScroll.call(inst, {detail: {scrollLeft: 50}} as never)
    e2(inst.data.maskStartShown).toBe(true)
    e2(inst.data.maskEndShown).toBe(true)
    inst.methods.onBarScroll.call(inst, {detail: {scrollLeft: 100}} as never)
    e2(inst.data.maskEndShown).toBe(false)
    inst.methods.onBarScroll.call(inst, {detail: {scrollLeft: 0}} as never)
    e2(inst.data.maskStartShown).toBe(false)
  })

  i2('immediate：ready 时派发当前项 change；仅一次', async () => {
    const a = makePane('a')
    const inst = mountDef(comp.def, {props: {immediate: true}})
    inst.attached()
    installQuery(inst, BAR_RECTS)
    inst.linkRelation('../tab-pane/index', a)
    inst.ready()
    e2(inst.eventsOf('change')).toEqual([
      {
        name: 'change',
        detail: {value: 'a', tab: {name: 'a', label: 'a', disabled: false}, index: 0, prevIndex: 0},
      },
    ])
    inst.ready() // immediateFired 守卫
    e2(inst.eventsOf('change')).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
  })

  i2('immediate：ready 时无 items → 不派发且不再补发', () => {
    const inst = mountDef(comp.def, {props: {immediate: true}})
    inst.attached()
    inst.ready()
    e2(inst.eventsOf('change')).toEqual([])
    const a = makePane('a')
    inst.linkRelation('../tab-pane/index', a) // 之后登记不补发
    e2(inst.eventsOf('change')).toEqual([])
  })

  i2('detached：reflow 定时器清理', async () => {
    const a = makePane('a')
    const inst = mountDef(comp.def)
    inst.attached()
    installQuery(inst, BAR_RECTS)
    inst.linkRelation('../tab-pane/index', a)
    inst.detached()
    await vi.advanceTimersByTimeAsync(10)
    e2(inst.data.contentWidth).toBe(0) // reflow 未执行
  })
})
