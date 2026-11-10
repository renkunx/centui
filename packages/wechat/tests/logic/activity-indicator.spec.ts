import {describe, it, expect} from 'vitest'
import {
  buildRollerStyles,
  buildSuccessStyles,
  buildCarouselDotStyle,
  buildCarouselBoxStyle,
  resolveStrokeWidth,
  CAROUSEL_PHASES,
  SUCCESS_BG,
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
