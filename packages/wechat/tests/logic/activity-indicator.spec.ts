import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {
  buildRollerStyles,
  buildSuccessStyles,
  buildCarouselDotStyle,
  buildCarouselBoxStyle,
  resolveStrokeWidth,
  CAROUSEL_PHASES,
  SUCCESS_BG,
  CAROUSEL_PHASE_INTERVAL,
} from '../../src/shared/indicator-ring'

/** Roller.vue 几何：viewBoxSize = size + 2*w，scale = size/viewBoxSize，外径 = (size+w)*scale */
function expectRing(size: number, width: number | undefined) {
  const w = resolveStrokeWidth(size, width)
  const scale = size / (size + 2 * w)
  const outer = (size + w) * scale
  const stroke = w * scale
  const pad = (size - outer) / 2
  return {w, outer, stroke, pad}
}

describe('indicator-ring/roller', () => {
  it('strokeWidth：width 未设置（0）时为 size/12（对齐 Vue computed）', () => {
    expect(resolveStrokeWidth(70, 0)).toBeCloseTo(70 / 12)
    expect(resolveStrokeWidth(70, 8)).toBe(8)
  })

  it('轨道圈几何换算与 Roller.vue viewBox 缩放公式一致', () => {
    const {outer, stroke, pad} = expectRing(70, 0)
    const s = buildRollerStyles({size: 70, width: 0, color: '#2F86F6', borderColor: 'rgba(0,0,0,.1)'})
    expect(s.box).toBe('position:relative;width:70px;height:70px;')
    expect(s.track).toContain(`width:${outer}px;`)
    expect(s.track).toContain(`border:${stroke}px solid rgba(0,0,0,.1);`)
    expect(s.track).toContain(`left:${pad}px;`)
  })

  it('rotate 属性施加于环容器', () => {
    const s = buildRollerStyles({size: 70, color: '#2F86F6', borderColor: '#000', rotate: 90})
    expect(s.box).toContain('transform:rotateZ(90deg);')
  })

  it('不定态：88% 弧长（110*360/125）+ cu-rotate 2s 匀速旋转', () => {
    const s = buildRollerStyles({size: 70, color: '#2F86F6', borderColor: '#000'})
    expect(s.auto).toBe(true)
    expect(s.arc).toContain('conic-gradient(from 0deg, #2F86F6 0deg 316.8deg, transparent 316.8deg 360deg)')
    expect(s.arc).toContain('animation:cu-rotate 2s linear infinite;')
  })

  it('进度态：弧自 3 点钟（conic from 90deg）顺时针 process*360，余量回退轨道色', () => {
    const s = buildRollerStyles({size: 70, color: '#F00', borderColor: '#BBB', process: 0.25})
    expect(s.auto).toBe(false)
    expect(s.arc).toContain('conic-gradient(from 90deg, #F00 0deg 90deg, #BBB 90deg 360deg)')
    expect(s.arc).not.toContain('animation')
  })

  it('进度超界收敛到 [0,1]（conic 角度约束，差异已声明）', () => {
    const s = buildRollerStyles({size: 70, color: '#F00', borderColor: '#BBB', process: 1.5})
    expect(s.arc).toContain('360deg')
  })

  it('fill 实心盘仅在非 transparent 时生成，直径为环内径', () => {
    const empty = buildRollerStyles({size: 70, color: '#F00', borderColor: '#BBB'})
    expect(empty.fillDisc).toBe('')
    const {outer, stroke, pad} = expectRing(70, 0)
    const filled = buildRollerStyles({size: 70, color: '#F00', borderColor: '#BBB', fill: '#FFF6F1'})
    expect(filled.fillDisc).toContain(`width:${outer - 2 * stroke}px;`)
    expect(filled.fillDisc).toContain(`left:${pad + stroke}px;`)
    expect(filled.fillDisc).toContain('background:#FFF6F1;')
  })

  it('mask 挖环内径 = 外径 - 2*stroke（留 1% 抗锯齿）', () => {
    const s = buildRollerStyles({size: 70, color: '#F00', borderColor: '#BBB'})
    expect(s.arc).toContain('transparent 0 84.62%, #000 85.62%')
  })
})

describe('indicator-ring/roller-success', () => {
  it('实心盘直径 = 80 * size / (size + 2*sw)，底色为 Vue 源硬编码 #FFF6F1', () => {
    const s = buildSuccessStyles({size: 70, color: '#28AA8F', strokeWidth: 8})
    expect(SUCCESS_BG).toBe('#FFF6F1')
    expect(s.disc).toContain('width:65.12px;') // 80*70/86
    expect(s.disc).toContain('background:#FFF6F1;')
    expect(s.box).toBe('position:relative;width:70px;height:70px;')
  })

  it('对勾两条短条：长度/角度按 100-viewBox 坐标系换算并随 size/70 缩放', () => {
    const s = buildSuccessStyles({size: 70, color: '#28AA8F', strokeWidth: 8})
    // bar0: (32,47)→(45,62)，len=√394≈19.85，angle=atan2(15,13)≈49.09°
    expect(s.bar0).toContain('left:32.00px;')
    expect(s.bar0).toContain('width:19.85px;')
    expect(s.bar0).toContain('rotate(49.09deg)')
    // bar1: (42,62)→(68.4,40)，len=√1180.96≈34.37，angle≈-39.81°
    expect(s.bar1).toContain('left:42.00px;')
    expect(s.bar1).toContain('width:34.37px;')
    expect(s.bar1).toContain('rotate(-39.81deg)')
    // strokeWidth 未传时默认 8，条宽 = 8 * size/70
    expect(s.bar0).toContain('height:8.00px;')
    // size 缩放：size=35 时条宽减半
    const half = buildSuccessStyles({size: 35, color: '#28AA8F'})
    expect(half.bar0).toContain('height:4.00px;')
  })
})

describe('indicator-ring/carousel', () => {
  it('相位值数组与 Vue circleAnimateValues 一致（7 相位）', () => {
    expect(CAROUSEL_PHASES).toEqual([
      [1, 0.8, 0.6, 0.6, 0.6, 0.8, 1],
      [0.6, 0.8, 1, 0.8, 0.6, 0.6, 0.6],
      [0.6, 0.6, 0.6, 0.8, 1, 0.8, 0.6],
    ])
  })

  it('圆点 cx = index*size*1.5 + size/2 → left = index*size*1.5，直径经 scale(v) 呈现', () => {
    // 第 2 个圆点、相位 0（值 0.6）
    const dot = buildCarouselDotStyle(1, 0, 30, '#2F86F6')
    expect(dot).toContain('left:45px;') // 1*30*1.5
    expect(dot).toContain('width:30px;height:30px;')
    expect(dot).toContain('opacity:0.6;transform:scale(0.6);')
    // 第 1 个圆点相位 0（值 1）
    const full = buildCarouselDotStyle(0, 0, 30, '#2F86F6')
    expect(full).toContain('left:0px;')
    expect(full).toContain('opacity:1;transform:scale(1);')
    const dim = buildCarouselDotStyle(0, 2, 30, '#2F86F6')
    expect(dim).toContain('opacity:0.6;transform:scale(0.6);')
  })

  it('舞台宽 = len*size + (len-1)*size/2 = 4*size', () => {
    expect(buildCarouselBoxStyle(30)).toBe('position:relative;width:120px;height:30px;')
  })
})

/**
 * 组件层（index.ts）：三态样式派生（roller/success/spinner/carousel）、carousel
 * 相位定时器、文字样式、插槽探针与 detached 清理。
 */
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/activity-indicator/index'))

describe('activity-indicator 组件', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('attached（默认 roller 不定态）：样式派生、hasFill=false、无 carousel 定时器', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.rollerBoxStyle).toBe('position:relative;width:70px;height:70px;')
    expect(inst.data.rollerArcStyle).toContain('316.8deg')
    expect(inst.data.rollerArcStyle).toContain('animation:cu-rotate 2s linear infinite;')
    expect(inst.data.rollerFillStyle).toBe('')
    expect(inst.data.hasFill).toBe(false)
    expect(inst.data.spinnerStyle).toBe('')
    expect((inst as any).__aiState.carouselTimer).toBeNull()
  })

  it('roller：自定义色/fill/rotate（color 空回退默认 #2F86F6，fill 非透明 → hasFill）', () => {
    const inst = mountDef(comp.def, {
      props: {color: '#F00', fill: '#FFF6F1', rotate: 90, width: 8},
    })
    inst.attached()
    expect(inst.data.rollerArcStyle).toContain('#F00')
    expect(inst.data.rollerBoxStyle).toContain('transform:rotateZ(90deg);')
    expect(inst.data.rollerFillStyle).toContain('background:#FFF6F1;')
    expect(inst.data.hasFill).toBe(true)
  })

  it('isSuccess：success 样式分支（successColor 空回退默认，width 0 → 8）', () => {
    const inst = mountDef(comp.def, {props: {isSuccess: true, successColor: ''}})
    inst.attached()
    expect(inst.data.successBoxStyle).toBe('position:relative;width:70px;height:70px;')
    expect(inst.data.successDiscStyle).toContain('background:#FFF6F1;')
    expect(inst.data.successBar0Style).toContain(`background:${'#28AA8F'};`)
    expect(inst.data.successBar0Style).toContain('height:8.00px;')

    // 自定义 successColor 透传到对勾条
    const custom = mountDef(comp.def, {props: {isSuccess: true, successColor: '#123456'}})
    custom.attached()
    expect(custom.data.successBar1Style).toContain('background:#123456;')
  })

  it('spinner：dark 语义（color 空回退 dark → #000 底 + invert 滤镜）', () => {
    const inst = mountDef(comp.def, {props: {type: 'spinner', size: 30}})
    inst.attached()
    expect(inst.data.spinnerDark).toBe(true)
    expect(inst.data.spinnerStyle).toContain('background:repeating-conic-gradient(from 0deg, #000 0deg 15deg')
    expect(inst.data.spinnerStyle).toContain('filter:invert(1);')
    expect(inst.data.rollerBoxStyle).toBe('')
  })

  it('spinner：非 dark 自定义色 → glyph #eee 底、无滤镜', () => {
    const inst = mountDef(comp.def, {props: {type: 'spinner', color: 'red'}})
    inst.attached()
    expect(inst.data.spinnerDark).toBe(false)
    expect(inst.data.spinnerStyle).toContain('repeating-conic-gradient(from 0deg, #eee 0deg 15deg')
    expect(inst.data.spinnerStyle).not.toContain('filter')
  })

  it('carousel：舞台/圆点样式（color 空回退默认色）+ 相位定时器推进与类型切换清理', () => {
    const inst = mountDef(comp.def, {props: {type: 'carousel', size: 30}})
    inst.attached()
    expect(inst.data.carouselBoxStyle).toBe('position:relative;width:120px;height:30px;')
    expect(inst.data.carouselDots[0]).toContain('opacity:1;transform:scale(1);')
    expect(inst.data.carouselDots[0]).toContain('#2F86F6')
    const timer = (inst as any).__aiState.carouselTimer
    expect(timer).not.toBeNull()
    expect((inst as any).__aiState.timers.size()).toBe(1)

    // 相位推进：dot0 值 1 → 0.8
    vi.advanceTimersByTime(CAROUSEL_PHASE_INTERVAL)
    expect(inst.data.carouselDots[0]).toContain('opacity:0.8;transform:scale(0.8);')
    // 循环：7 相位回绕（再推进 6 拍回到相位 0）
    vi.advanceTimersByTime(CAROUSEL_PHASE_INTERVAL * 6)
    expect(inst.data.carouselDots[0]).toContain('opacity:1;transform:scale(1);')

    // 类型切回 roller：定时器清理
    inst.setData({type: 'roller'})
    expect((inst as any).__aiState.carouselTimer).toBeNull()
    expect((inst as any).__aiState.timers.size()).toBe(0)
  })

  it('carousel：自定义 color 透传圆点着色', () => {
    const inst = mountDef(comp.def, {props: {type: 'carousel', color: '#0A0'}})
    inst.attached()
    expect(inst.data.carouselDots[0]).toContain('#0A0')
  })

  it('样式 observers：任一几何键变更重派生；未知 type → 空补丁不崩溃', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({size: 40})
    expect(inst.data.rollerBoxStyle).toContain('width:40px;')
    inst.setData({process: 0.5})
    expect(inst.data.rollerArcStyle).toContain('from 90deg')
    inst.setData({isSuccess: true})
    expect(inst.data.successBoxStyle).toContain('width:40px;')
    inst.setData({isSuccess: false, type: 'weird'})
    expect(() => inst.setData({rotate: 30})).not.toThrow()
  })

  it('文字样式：textSize>0 加 font-size；attached 默认 #999', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.textStyle).toBe('color:#999;')
    inst.setData({textSize: 20})
    expect(inst.data.textStyle).toBe('color:#999;font-size:20px;')
    inst.setData({textColor: '#F00', textSize: 0})
    expect(inst.data.textStyle).toBe('color:#F00;')
  })

  it('ready 插槽探针：探针节点存在 → hasText=false；不存在保持 true', () => {
    const withText = mountDef(comp.def, {rects: {'#cu-ai-text-probe': {height: 0}}})
    withText.ready()
    expect(withText.data.hasText).toBe(false)

    const empty = mountDef(comp.def)
    empty.ready()
    expect(empty.data.hasText).toBe(true)
  })

  it('getStrokeWidth：width 0 → size/12；显式 width 原样', () => {
    const inst = mountDef(comp.def)
    expect(inst.methods.getStrokeWidth.call(inst)).toBeCloseTo(70 / 12)
    const w = mountDef(comp.def, {props: {width: 9}})
    expect(w.methods.getStrokeWidth.call(w)).toBe(9)
  })

  it('detached：carousel 定时器全量清理，推进不再派发', () => {
    const inst = mountDef(comp.def, {props: {type: 'carousel'}})
    inst.attached()
    expect((inst as any).__aiState.timers.size()).toBe(1)
    inst.detached()
    expect((inst as any).__aiState.timers.size()).toBe(0)
    const before = inst.data.carouselDots[0]
    vi.advanceTimersByTime(CAROUSEL_PHASE_INTERVAL * 3)
    expect(inst.data.carouselDots[0]).toBe(before)
  })
})
