/**
 * water-mark 纯逻辑测试：spacing 换算（Vue computedSpacing）、平铺次数换算
 * （Vue draw()，「双乘修复」语义）、水印插槽平铺结构（Vue 模板分支）。
 */
import {describe, it, expect} from 'vitest'
import {
  buildWatermarkLines,
  computeTileCount,
  resolveSpacing,
  spacingStyleOf,
  watermarkItemStyle,
  WATERMARK_FONT_SIZE,
  WATERMARK_REPETITION,
} from '../../src/components/water-mark/logic'

describe('water-mark/resolveSpacing（Vue computedSpacing）', () => {
  const W = 375
  const H = 667

  it('number 原样返回（不换算）', () => {
    expect(resolveSpacing(40, W, H)).toBe(40)
    expect(resolveSpacing(0, W, H)).toBe(0)
  })

  it("'12px' 直接取数值", () => {
    expect(resolveSpacing('12px', W, H)).toBe(12)
  })

  it("'20vw' 按屏宽换算（Vue window.screen.width 语义）", () => {
    expect(resolveSpacing('20vw', W, H)).toBeCloseTo((20 * W) / 100)
  })

  it("'10vh' 按屏高换算", () => {
    expect(resolveSpacing('10vh', W, H)).toBeCloseTo((10 * H) / 100)
  })

  it('正则不命中回退 20vw（Vue 解构默认值）', () => {
    expect(resolveSpacing('oops', W, H)).toBeCloseTo((20 * W) / 100)
    expect(resolveSpacing('', W, H)).toBeCloseTo((20 * W) / 100)
  })

  it('未知单位保持 0（Vue 各分支均未赋值）', () => {
    expect(resolveSpacing('20em', W, H)).toBe(0)
  })

  it('正则 [0-9]+([A-Za-z]+) 命中「5px」段（v2 语义：小数点截断首个数字组）', () => {
    expect(resolveSpacing('12.5px', W, H)).toBe(5)
  })
})

describe('water-mark/computeTileCount（Vue draw() 双乘修复语义）', () => {
  const FONT = WATERMARK_FONT_SIZE

  it('容器 375×667、ratio=2、content 4 字、spacing 20vw 设备像素口径', () => {
    // Vue: ctxWidth = 375*2 = 750；contentLength = 4*14*2 = 112；
    // realSpacing = 20vw(75px)*2 = 150；fontSize = 28
    const {xCount, yCount} = computeTileCount(750, 1334, 4 * FONT * 2, 75 * 2, FONT * 2)
    expect(xCount).toBe(Math.ceil(750 / (112 + 150)))
    expect(yCount).toBe(Math.ceil(1334 / (28 + 150)))
  })

  it('ratio=1 退化为 CSS 像素口径', () => {
    const {xCount, yCount} = computeTileCount(375, 667, 4 * FONT, 75, FONT)
    expect(xCount).toBe(Math.ceil(375 / (56 + 75)))
    expect(yCount).toBe(Math.ceil(667 / (14 + 75)))
  })

  it('零间距：xCount/yCount 不为 Infinity（整除时恰好铺满）', () => {
    const {xCount, yCount} = computeTileCount(100, 100, FONT * 2, 0, FONT)
    expect(xCount).toBe(Math.ceil(100 / 28))
    expect(yCount).toBe(Math.ceil(100 / 14))
  })

  it('小画布/长文本：至少平铺 1 次（ceil 语义）', () => {
    const {xCount, yCount} = computeTileCount(10, 10, 1000, 50, FONT)
    expect(xCount).toBe(1)
    expect(yCount).toBe(1)
  })
})

describe('water-mark/buildWatermarkLines（插槽平铺结构）', () => {
  it('默认 repeatX/repeatY：50 行 × 50 列（v2 生产契约）', () => {
    const tiling = buildWatermarkLines(true, true, '20vw')
    expect(WATERMARK_REPETITION).toBe(50)
    expect(tiling.lineStyles).toHaveLength(50)
    expect(tiling.itemStyles).toHaveLength(50)
    expect(tiling.itemCount).toBe(50)
  })

  it('repeatX=false：每行 1 项，item 无边距', () => {
    const tiling = buildWatermarkLines(false, true, '10px')
    expect(tiling.itemCount).toBe(1)
    expect(tiling.itemStyles.every(s => s === '')).toBe(true)
    expect(tiling.lineStyles[0]).toBe('margin-bottom:10px')
  })

  it('repeatY=false：单行', () => {
    const tiling = buildWatermarkLines(true, false, '20vw')
    expect(tiling.lineStyles).toHaveLength(1)
    expect(tiling.itemCount).toBe(50)
  })

  it('奇偶行规则：1 基偶数行 margin-left、奇数行 margin-right（Vue li :style）', () => {
    const tiling = buildWatermarkLines(true, true, '20vw')
    expect(tiling.itemStyles[0]).toBe('margin-right:20vw') // 第 1 行
    expect(tiling.itemStyles[1]).toBe('margin-left:20vw') // 第 2 行
    expect(tiling.itemStyles[2]).toBe('margin-right:20vw') // 第 3 行
  })

  it('number spacing 补 px 单位；同参数幂等（测试可注入 repetition）', () => {
    const tiling = buildWatermarkLines(true, true, 40, 2)
    expect(tiling.lineStyles).toEqual(['margin-bottom:40px', 'margin-bottom:40px'])
    expect(tiling.itemStyles).toEqual([
      'margin-right:40px',
      'margin-left:40px',
    ])
    expect(buildWatermarkLines(true, true, '8px', 1)).toEqual({
      lineStyles: ['margin-bottom:8px'],
      itemStyles: ['margin-right:8px'],
      itemCount: 1,
    })
  })
})

describe('water-mark/watermarkItemStyle 与 spacingStyleOf', () => {
  it('watermarkItemStyle 奇偶行语义（1 基）', () => {
    expect(watermarkItemStyle(1, true, '8px')).toBe('margin-right:8px')
    expect(watermarkItemStyle(2, true, '8px')).toBe('margin-left:8px')
    expect(watermarkItemStyle(3, false, '8px')).toBe('')
  })

  it('spacingStyleOf：number 补 px，字符串原样', () => {
    expect(spacingStyleOf(40)).toBe('40px')
    expect(spacingStyleOf('20vw')).toBe('20vw')
  })
})

// ---------------------------------------------------------------------------
// water-mark 组件实例（index.ts）：attached 派生、observers、canvas 初始化与绘制、
// 插槽探测、防御分支
// ---------------------------------------------------------------------------
import {beforeEach as b2, afterEach as a2, describe as d2, expect as e2, it as i2, vi} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/water-mark/index'))

b2(() => vi.useFakeTimers())
a2(() => vi.useRealTimers())

interface WmState {
  ctx: Record<string, unknown> | null
  node: Record<string, unknown> | null
  containerWidth: number
  containerHeight: number
  ratio: number
  initialized: boolean
}

function stateOf(inst: Mounted): WmState {
  return (inst as unknown as {__waterMarkState: WmState}).__waterMarkState
}

function makeCanvas(withCtx = true) {
  const ctx = {
    scale: vi.fn(),
    fillText: vi.fn(),
    clearRect: vi.fn(),
  }
  const node = {width: 0, height: 0, getContext: vi.fn(() => (withCtx ? ctx : null))}
  return {ctx, node}
}

/** 覆盖实例的 createSelectorQuery：select + fields 按序回放 */
function installQuery(
  inst: Mounted,
  provide: () => unknown[],
) {
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
          fields(_f: Record<string, unknown>) {
            collected.push(grab())
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

d2('water-mark attached 与 observers', () => {
  i2('attached：wrapperStyle/tiling/spacing 派生（properties 初始值不触发 observer）', () => {
    const inst = mountDef(comp.def)
    e2(inst.data.tiling.itemCount).toBe(1) // 初始 data 字面量
    inst.attached()
    e2(inst.data.wrapperStyle).toBe('opacity:0.1;transform:rotate(-30deg)')
    e2(inst.data.hasWatermark).toBe(false)
    e2(inst.data.tiling.itemCount).toBe(50) // 默认 repeatX/Y → 50 列
    e2(inst.data.itemIndexes).toHaveLength(50)
    e2(inst.data.spacingStyle).toBe('20vw')
    e2(inst.data.repeatXView).toBe(true)
  })

  i2('attached：content 非空 → hasWatermark true', () => {
    const inst = mountDef(comp.def, {props: {content: 'CentUI'}})
    inst.attached()
    e2(inst.data.hasWatermark).toBe(true)
  })

  i2('rotate/opacity observer：wrapperStyle 重写', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({rotate: -45, opacity: 0.5})
    e2(inst.data.wrapperStyle).toBe('opacity:0.5;transform:rotate(-45deg)')
  })

  i2('repeatX/repeatY/spacing observer：tiling 重建', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({repeatX: false})
    e2(inst.data.tiling.itemCount).toBe(1) // 列数 = 1
    e2(inst.data.tiling.itemStyles).toHaveLength(50) // 行样式仍按行展开
    e2(inst.data.tiling.itemStyles.every((x: string) => x === '')).toBe(true)
    e2(inst.data.repeatXView).toBe(false)
    inst.setData({spacing: 30})
    e2(inst.data.spacingStyle).toBe('30px')
    e2(inst.data.tiling.itemStyles.every((x: string) => x === '')).toBe(true) // repeatX false → 无边距
  })

  i2('content observer：hasWatermark 同步；同值/空值早退（直调双参）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    const obs = comp.def.observers!.content as (val: string, old: string) => void
    obs.call(inst, 'X', 'X') // 同值 → 早退（不 init；state 未创建）
    e2(inst.data.hasWatermark).toBe(true)
    e2((inst as unknown as {__waterMarkState?: {initialized: boolean}}).__waterMarkState?.initialized ?? false).toBe(false)
    obs.call(inst, '', '') // 空值 → 早退
    e2(inst.data.hasWatermark).toBe(false)
    // harness 语义：setData 单参（oldVal undefined）→ 非空值走 initCanvas
    inst.setData({content: 'X'})
    e2(stateOf(inst).initialized).toBe(false) // 默认查询无 node → 早退
  })

  i2('content observer（直调双参）：未初始化 → initCanvas；已初始化 → redraw', () => {
    const {ctx, node} = makeCanvas()
    const inst = mountDef(comp.def, {props: {content: 'A'}})
    installQuery(inst, () => [{width: 100, height: 80}, {node, width: 100, height: 80}])
    inst.attached()
    inst.ready() // 初始 content → initCanvas
    e2(stateOf(inst).initialized).toBe(true)

    const obs = comp.def.observers!.content as (val: string, old: string) => void
    obs.call(inst, 'B', 'A') // 已初始化 → redraw
    e2(ctx.clearRect).toHaveBeenCalledTimes(1)
    e2(ctx.fillText.mock.calls.length).toBeGreaterThan(0)

    const blank = mountDef(comp.def) // content 空 + 未初始化
    blank.attached()
    installQuery(blank, () => [{width: 100, height: 80}, {node, width: 100, height: 80}])
    obs.call(blank, 'X', '') // !initialized → initCanvas
    e2(stateOf(blank).initialized).toBe(true)
  })
})

d2('water-mark canvas 初始化与绘制', () => {
  i2('ready + content：量取容器/节点 → ratio、canvasStyle、ctx.scale、平铺 fillText', () => {
    const {ctx, node} = makeCanvas()
    const inst = mountDef(comp.def, {props: {content: 'CentUI'}})
    installQuery(inst, () => [{width: 375, height: 300}, {node, width: 375, height: 300}])
    inst.attached()
    inst.ready()
    e2(stateOf(inst).ratio).toBe(2) // pixelRatio 2
    e2(stateOf(inst).containerWidth).toBe(375)
    e2(inst.data.canvasStyle).toBe('width:750px;height:600px;')
    e2(node.width).toBe(750)
    e2(node.height).toBe(600)
    e2(ctx.scale).toHaveBeenCalledWith(0.5, 0.5)
    e2(ctx.font).toContain('28px') // 14 * 2
    e2(ctx.fillStyle).toBe('#858B9C')
    const expected = computeTileCount(
      375 * 2,
      300 * 2,
      'CentUI'.length * WATERMARK_FONT_SIZE * 2,
      resolveSpacing('20vw', 375, undefined as never) * 2,
      WATERMARK_FONT_SIZE * 2,
    )
    e2(ctx.fillText).toHaveBeenCalledTimes(expected.xCount * expected.yCount)
    e2(stateOf(inst).initialized).toBe(true)
  })

  i2('ratio 下限：pixelRatio 1 → ratio 2；pixelRatio 3 → ratio 3', () => {
    const g = globalThis as unknown as {wx: {getWindowInfo?: () => unknown}}
    const prev = g.wx.getWindowInfo
    const {node} = makeCanvas()
    const inst = mountDef(comp.def, {props: {content: 'X'}})
    installQuery(inst, () => [{width: 100, height: 100}, {node, width: 100, height: 100}])
    inst.attached()
    g.wx.getWindowInfo = () => ({pixelRatio: 1, windowWidth: 375})
    inst.ready()
    e2(stateOf(inst).ratio).toBe(2)
    g.wx.getWindowInfo = () => ({pixelRatio: 3, windowWidth: 375})
    const {node: node2} = makeCanvas()
    installQuery(inst, () => [{width: 100, height: 100}, {node: node2, width: 100, height: 100}])
    const inst2 = mountDef(comp.def, {props: {content: 'X'}})
    installQuery(inst2, () => [{width: 100, height: 100}, {node: node2, width: 100, height: 100}])
    inst2.attached()
    inst2.ready()
    e2(stateOf(inst2).ratio).toBe(3)
    g.wx.getWindowInfo = prev
  })

  i2('防御：已初始化不再 init；rect/node 缺失早退；ctx 缺失早退', () => {
    const {node} = makeCanvas(false) // getContext → null
    const inst = mountDef(comp.def, {props: {content: 'X'}})
    installQuery(inst, () => [{width: 100, height: 100}, {node, width: 100, height: 100}])
    inst.attached()
    inst.ready()
    e2(stateOf(inst).initialized).toBe(false) // ctx null 早退
    e2(stateOf(inst).ctx).toBe(null)

    const noRect = mountDef(comp.def, {props: {content: 'X'}})
    noRect.attached()
    installQuery(noRect, () => [null, null])
    e2(() => noRect.ready()).not.toThrow()
    e2(stateOf(noRect).initialized).toBe(false)

    const done = mountDef(comp.def, {props: {content: 'X'}})
    done.attached()
    const {node: n2} = makeCanvas()
    installQuery(done, () => [{width: 100, height: 100}, {node: n2, width: 100, height: 100}])
    done.ready()
    const calls = n2.getContext as ReturnType<typeof vi.fn>
    e2(calls.mock.calls.length).toBe(1)
    e2(() => done.methods.__initCanvas.call(done)).not.toThrow() // initialized → return
    e2(calls.mock.calls.length).toBe(1)
  })

  i2('__draw / __redraw 防御：无 ctx / 无 content / 无 node', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    e2(() => inst.methods.__draw.call(inst)).not.toThrow() // ctx null
    e2(() => inst.methods.__redraw.call(inst)).not.toThrow() // node/ctx null

    const {ctx, node} = makeCanvas()
    const full = mountDef(comp.def, {props: {content: 'X'}})
    installQuery(full, () => [{width: 100, height: 100}, {node, width: 100, height: 100}])
    full.attached()
    full.ready()
    full.setData({content: ''}) // 清空内容（observer 空值早退）
    ctx.fillText.mockClear()
    e2(() => full.methods.__draw.call(full)).not.toThrow() // content '' → 早退
    e2(ctx.fillText).not.toHaveBeenCalled()
    full.setData({content: 'Y'}) // observer：非空且已初始化 → redraw（清屏重绘）
    e2(ctx.clearRect).toHaveBeenCalledTimes(1)
    e2(ctx.fillText).toHaveBeenCalled()
    ctx.clearRect.mockClear()
    full.methods.__redraw.call(full) // 直调再绘
    e2(ctx.clearRect).toHaveBeenCalledTimes(1)
  })
})

d2('water-mark 插槽探测与清理', () => {
  i2('ready：插槽探测有高度 → hasWatermarkSlot/hasWatermark；rect null 不变', () => {
    const inst = mountDef(comp.def, {rects: {'.water-mark-slot-probe': {height: 10}}})
    inst.attached()
    inst.ready()
    e2(inst.data.hasWatermarkSlot).toBe(true)
    e2(inst.data.hasWatermark).toBe(true)

    const none = mountDef(comp.def)
    none.attached()
    none.ready()
    e2(none.data.hasWatermarkSlot).toBe(false)
  })

  i2('ready：content 非空 / hasWatermark 已真 → 探测早退', () => {
    const withContent = mountDef(comp.def, {props: {content: 'X'}})
    withContent.attached()
    withContent.ready()
    e2(withContent.data.hasWatermarkSlot).toBe(false) // content 非空 → 探测跳过（查询来自 initCanvas）

    const marked = mountDef(comp.def)
    marked.attached()
    marked.setData({hasWatermark: true})
    const spy2 = vi.spyOn(marked, 'createSelectorQuery')
    marked.ready()
    e2(spy2).not.toHaveBeenCalled() // hasWatermark 已真 → 跳过
  })

  i2('detached：定时器清理不崩', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    e2(() => inst.detached()).not.toThrow()
  })
})
