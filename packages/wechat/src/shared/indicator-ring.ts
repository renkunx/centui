/**
 * roller 进度环的纯几何构建（activity-indicator / progress 共用）：
 * Vue 版 Roller.vue 用 SVG circle stroke（border 圆环 + stroke-dasharray 进度弧 + SMIL 动画），
 * 小程序无 SVG DOM，按下列映射实现（全部 inline style，几何值由 JS 按源码公式换算）：
 *
 *  - 轨道圈（borderColor 描边圆）→ border 圆环（box-sizing:border-box）
 *  - 填充（fill）→ 内部实心圆盘
 *  - 进度弧（process 0-1）→ conic-gradient 双色扇形 + 径向渐变 mask 挖环
 *    （SVG circle 描边自 3 点钟方向顺时针 → conic from 90deg）
 *  - 不定态动画（process 未传）→ 88% 弧长缺口环（对齐 dasharray 110*perimeter/125）
 *    + cu-rotate 2s linear 旋转（global.wxss keyframes；Vue 为 spline 缓动的
 *    dashoffset 形变 + rotate 组合，此处近似为匀速旋转）
 *  - linecap 仅 SVG stroke 语义，conic 方案下为 no-op（文件头差异声明）
 *
 * 全部函数为纯函数，几何公式与 Roller.vue 逐一对照：
 *   strokeWidth = width || size/12
 *   viewBoxSize = size + 2*strokeWidth   （渲染盒 = size×size，内部按 scale 缩放）
 *   scale       = size / viewBoxSize
 *   ringOuter   = (size + strokeWidth) * scale    （圆环外径 px）
 *   ringStroke  = strokeWidth * scale             （描边宽 px）
 */

const AUTO_ARC_DEG = (110 / 125) * 360 // 316.8：对齐 Vue dasharray 110*perimeter/125
const AUTO_ROTATE_SECONDS = 2 // Roller.vue animateTransform dur="2s"

export interface RollerOptions {
  size: number
  /** 0 视为未设置（Vue undefined）→ strokeWidth = size/12 */
  width?: number
  color: string
  borderColor: string
  fill?: string
  rotate?: number
  /** 进度 0-1；<0 表示未设置（不定态动画），对齐 Vue process === undefined */
  process?: number
}

export interface RollerStyles {
  /** 环容器（尺寸 = size×size，rotate 在此施加） */
  box: string
  /** 轨道圈（borderColor 描边） */
  track: string
  /** 进度弧（conic + mask；auto 态带旋转动画） */
  arc: string
  /** fill 实心盘（fill 为空/transparent 时为空串） */
  fillDisc: string
  /** 是否不定态动画 */
  auto: boolean
}

export function resolveStrokeWidth(size: number, width?: number): number {
  return width && width > 0 ? width : size / 12
}

function ringGeometry(size: number, width?: number) {
  const strokeWidth = resolveStrokeWidth(size, width)
  const scale = size / (size + 2 * strokeWidth)
  const outer = (size + strokeWidth) * scale
  const stroke = strokeWidth * scale
  const pad = (size - outer) / 2
  return {strokeWidth, scale, outer, stroke, pad}
}

/** 环形 mask（内径 = 外径 - 2*stroke，留 1% 抗锯齿过渡） */
function ringMask(outer: number, stroke: number): string {
  const innerPct = ((outer - 2 * stroke) / outer) * 100
  const ring = (pct: number) => pct.toFixed(2)
  const mask =
    `radial-gradient(circle closest-side, transparent 0 ${ring(innerPct)}%, #000 ${ring(innerPct + 1)}%)`
  return (
    `-webkit-mask-image:${mask};` +
    `mask-image:${mask};`
  )
}

export function buildRollerStyles(opts: RollerOptions): RollerStyles {
  const size = opts.size
  const {outer, stroke, pad} = ringGeometry(size, opts.width)
  const rotate = opts.rotate || 0
  const box =
    `position:relative;width:${size}px;height:${size}px;` +
    (rotate ? `transform:rotateZ(${rotate}deg);` : '')
  const track =
    `position:absolute;left:${pad}px;top:${pad}px;width:${outer}px;height:${outer}px;` +
    `box-sizing:border-box;border:${stroke}px solid ${opts.borderColor};border-radius:50%;`

  let fillDisc = ''
  if (opts.fill && opts.fill !== 'transparent') {
    fillDisc =
      `position:absolute;left:${pad + stroke}px;top:${pad + stroke}px;` +
      `width:${outer - 2 * stroke}px;height:${outer - 2 * stroke}px;` +
      `background:${opts.fill};border-radius:50%;`
  }

  const process = opts.process ?? -1
  const auto = process < 0
  // Vue 无 clamp；conic-gradient 角度需落在 0-360，超界值收敛到 [0,1]（差异声明）
  const deg = Math.max(0, Math.min(1, process)) * 360
  const background = auto
    ? `conic-gradient(from 0deg, ${opts.color} 0deg ${AUTO_ARC_DEG}deg, transparent ${AUTO_ARC_DEG}deg 360deg)`
    : `conic-gradient(from 90deg, ${opts.color} 0deg ${deg}deg, ${opts.borderColor} ${deg}deg 360deg)`
  const arc =
    `position:absolute;left:${pad}px;top:${pad}px;width:${outer}px;height:${outer}px;` +
    `border-radius:50%;background:${background};` +
    ringMask(outer, stroke) +
    (auto ? `animation:cu-rotate ${AUTO_ROTATE_SECONDS}s linear infinite;` : '')

  return {box, track, arc, fillDisc, auto}
}

// ---------------------------------------------------------------------------
// roller-success（Vue 版 RollerSuccess.vue）：#FFF6F1 实心盘 + 两段旋转短条对勾
// ---------------------------------------------------------------------------

/** Vue 源硬编码色（RollerSuccess.vue fill="#FFF6F1"，非 token，原样保留） */
export const SUCCESS_BG = '#FFF6F1'

/** 对勾几何（RollerSuccess.vue 100×100 viewBox 内两条 line，按 size/70 缩放） */
const BAR0 = {x: 32, y: 47, dx: 13, dy: 15}
const BAR1 = {x: 42, y: 62, dx: 26.4, dy: -22}

export interface SuccessStyles {
  /** 相对定位容器（尺寸 = size×size） */
  box: string
  /** 实心盘（直径 = 80 * size / (size + 2*strokeWidth)，对齐 r=40 圆的换算） */
  disc: string
  bar0: string
  bar1: string
}

export function buildSuccessStyles(opts: {
  size: number
  color: string
  /** 0 视为未设置 → 8（RollerSuccess 默认 strokeWidth=8） */
  strokeWidth?: number
}): SuccessStyles {
  const size = opts.size
  const sw = opts.strokeWidth && opts.strokeWidth > 0 ? opts.strokeWidth : 8
  const k = size / 70
  const discD = (80 * size) / (size + 2 * sw)
  const box = `position:relative;width:${size}px;height:${size}px;`
  const disc =
    `position:absolute;left:${((size - discD) / 2).toFixed(2)}px;top:${((size - discD) / 2).toFixed(2)}px;` +
    `width:${discD.toFixed(2)}px;height:${discD.toFixed(2)}px;background:${SUCCESS_BG};border-radius:50%;`
  const bar = (b: {x: number; y: number; dx: number; dy: number}) => {
    const len = Math.sqrt(b.dx * b.dx + b.dy * b.dy)
    const angle = (Math.atan2(b.dy, b.dx) * 180) / Math.PI
    const h = sw * k
    return (
      `position:absolute;left:${(b.x * k).toFixed(2)}px;top:${(b.y * k - h / 2).toFixed(2)}px;` +
      `width:${(len * k).toFixed(2)}px;height:${h.toFixed(2)}px;background:${opts.color};` +
      `border-radius:${(h / 2).toFixed(2)}px;transform-origin:0 50%;transform:rotate(${angle.toFixed(2)}deg);`
    )
  }
  return {box, disc, bar0: bar(BAR0), bar1: bar(BAR1)}
}

// ---------------------------------------------------------------------------
// carousel（Vue 版 Carousel.vue + CarouselCircle.vue）：SMIL r/opacity 动画 →
// 定时器逐相位近似，7 相位线性循环 1s
// ---------------------------------------------------------------------------

export const CAROUSEL_PHASES: number[][] = [
  [1, 0.8, 0.6, 0.6, 0.6, 0.8, 1],
  [0.6, 0.8, 1, 0.8, 0.6, 0.6, 0.6],
  [0.6, 0.6, 0.6, 0.8, 1, 0.8, 0.6],
]
export const CAROUSEL_PHASE_INTERVAL = 1000 / 7

/** 单相位下第 index 个圆点的 inline style */
export function buildCarouselDotStyle(index: number, phase: number, size: number, color: string): string {
  const v = CAROUSEL_PHASES[index][phase]
  const left = index * size * 1.5
  return (
    `position:absolute;left:${left}px;top:0;width:${size}px;height:${size}px;` +
    `border-radius:50%;background:${color};opacity:${v};transform:scale(${v});`
  )
}

/** 舞台盒宽 = len*size + (len-1)*size/2 = 4*size（len=3），高 = size */
export function buildCarouselBoxStyle(size: number): string {
  return `position:relative;width:${size * 4}px;height:${size}px;`
}
