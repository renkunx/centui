/**
 * Source: packages/vue/src/components/activity-indicator/{ActivityIndicator,Roller,Spinning,Carousel,CarouselCircle,RollerSuccess}.vue
 *
 * 三态子组件（roller/spinner/carousel）按任务要求合并为单组件 type 属性；
 * RollerSuccess 并入为 is-success 属性（type=roller 时生效）。
 * 平台差异（SVG/SMIL 无等价物，详见下文与 shared/indicator-ring.ts 头注释）。
 *
 * 映射：
 *  props    type(roller/spinner/carousel), size, width, color, textColor, textSize,
 *           vertical（ActivityIndicator.vue 全量）
 *           + Roller.vue 合并项：process(进度 0-1，不传/-1 为不定态), borderColor,
 *             fill, rotate；linecap 保留但为 no-op（conic-gradient 无 stroke 语义）
 *           + RollerSuccess.vue 合并项：isSuccess, successColor(默认 #28AA8F)，
 *             success 描边宽复用 width（未传为 8）
 *  events   无（全部子组件无 emits）
 *  slots    默认插槽（文字，渲染于指示器旁，对齐 ActivityIndicator $slots.default）
 *           center 具名插槽（roller 环心内容，对齐 Roller 默认插槽，progress 用）
 *           defs 具名插槽（SVG defs 无平台等价物，no-op——差异声明）
 *
 * 平台差异（详见 shared/indicator-ring.ts 头注释）：
 *  1. roller：SVG stroke 圆环/进度弧 → border 轨道圈 + conic-gradient 弧 + 径向 mask；
 *     不定态为 88% 缺口弧 + cu-rotate 2s 匀速旋转（Vue 为 spline 缓动 dashoffset 形变）。
 *  2. spinner：SMIL 点阵图标（mask 不播 SMIL）→ 纯 CSS 12 段虚线环
 *     （repeating-conic-gradient + 径向 mask + cu-rotate steps(12)），
 *     dark 态以 #000 底 + invert(1) 滤镜复现 Vue 的反色（Vue 源 glyph fill=#eee）。
 *  3. carousel：SMIL r/opacity 动画 → 定时器 7 相位离散近似（1s 循环）。
 *  4. is-success：对勾两段 line 的 stroke-dashoffset 生长动画无等价物，静态呈现。
 *  5. 文字视图以「插槽探针」判定有无内容（Vue 为 $slots.default 同步判断），
 *     ready 后一帧内收敛。
 *  6. 默认色复刻 Vue 源常量：roller/carousel '#2F86F6'、spinner 'dark'、success '#28AA8F'。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  buildCarouselBoxStyle,
  buildCarouselDotStyle,
  buildRollerStyles,
  buildSuccessStyles,
  CAROUSEL_PHASE_INTERVAL,
  resolveStrokeWidth,
} from '../../shared/indicator-ring'

/** Vue 源默认色常量（ActivityIndicator/Carousel/RollerSuccess 硬编码，非 token） */
const DEFAULT_COLOR = '#2F86F6'
const DEFAULT_SUCCESS_COLOR = '#28AA8F'
/** Vue Spinning.vue glyph fill=#eee；dark 态 filter invert(1) → 深色 */
const SPINNER_GLYPH_COLOR = '#eee'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** roller | spinner | carousel */
    type: {type: String, value: 'roller'},
    size: {type: Number, value: 70},
    /** 描边宽；0 视为未设置（Vue undefined）→ size/12（success 态默认 8） */
    width: {type: Number, value: 0},
    color: {type: String, value: ''},
    textColor: {type: String, value: '#999'},
    textSize: {type: Number, value: 0},
    vertical: {type: Boolean, value: false},
    /** Roller.vue：进度 0-1；<0 为不定态动画 */
    process: {type: Number, value: -1},
    borderColor: {type: String, value: 'rgba(0, 0, 0, .1)'},
    fill: {type: String, value: 'transparent'},
    /** SVG stroke 语义，小程序 no-op */
    linecap: {type: String, value: 'round'},
    rotate: {type: Number, value: 0},
    /** RollerSuccess.vue 并入（type=roller 生效） */
    isSuccess: {type: Boolean, value: false},
    successColor: {type: String, value: DEFAULT_SUCCESS_COLOR},
  },

  data: {
    textStyle: '',
    hasText: true,
    // roller
    rollerBoxStyle: '',
    rollerTrackStyle: '',
    rollerArcStyle: '',
    rollerFillStyle: '',
    hasFill: false,
    // success
    successBoxStyle: '',
    successDiscStyle: '',
    successBar0Style: '',
    successBar1Style: '',
    // spinner
    spinnerStyle: '',
    spinnerDark: false,
    // carousel
    carouselBoxStyle: '',
    carouselDots: [] as string[],
  },

  observers: {
    'type, size, width, color, borderColor, fill, rotate, process, isSuccess, successColor'() {
      this.__refreshStyles()
    },
    'textColor, textSize'() {
      this.__refreshTextStyle()
    },
    type(type: string) {
      this.__syncCarouselTimer(type)
    },
  },

  lifetimes: {
    attached() {
      indicatorState(this)
      this.__refreshStyles()
      this.__refreshTextStyle()
      this.__syncCarouselTimer(this.data.type)
    },
    ready() {
      // 插槽内容就绪后再探测（attached 时插槽可能尚未挂载）
      this.__probeTextSlot()
    },
    detached() {
      timers(this).clearAll()
    },
  },

  methods: {
    __refreshStyles() {
      const d = this.data
      const color = d.color || (d.type === 'spinner' ? 'dark' : DEFAULT_COLOR)
      const patch: Record<string, unknown> = {}
      if (d.isSuccess && d.type === 'roller') {
        const s = buildSuccessStyles({size: d.size, color: d.successColor || DEFAULT_SUCCESS_COLOR, strokeWidth: d.width})
        patch.successBoxStyle = s.box
        patch.successDiscStyle = s.disc
        patch.successBar0Style = s.bar0
        patch.successBar1Style = s.bar1
      } else if (d.type === 'roller') {
        const s = buildRollerStyles({
          size: d.size,
          width: d.width,
          color,
          borderColor: d.borderColor,
          fill: d.fill,
          rotate: d.rotate,
          process: d.process,
        })
        patch.rollerBoxStyle = s.box
        patch.rollerTrackStyle = s.track
        patch.rollerArcStyle = s.arc
        patch.rollerFillStyle = s.fillDisc
        patch.hasFill = !!s.fillDisc
      } else if (d.type === 'spinner') {
        // dark 语义对齐 Vue Spinning：仅 color==='dark' 反色，其余 color 值不参与着色
        const dark = color === 'dark'
        const size = d.size
        // 12 段虚线环：Vue glyph 虚线带宽 ≈ 7/100、位于半径 17.5%-34.5%（100 viewBox）
        const bg = dark ? '#000' : SPINNER_GLYPH_COLOR
        patch.spinnerDark = dark
        patch.spinnerStyle =
          `width:${size}px;height:${size}px;` +
          `background:repeating-conic-gradient(from 0deg, ${bg} 0deg 15deg, transparent 15deg 30deg);` +
          '-webkit-mask-image:radial-gradient(circle closest-side, transparent 0 34%, #000 36%, #000 68%, transparent 70%);' +
          'mask-image:radial-gradient(circle closest-side, transparent 0 34%, #000 36%, #000 68%, transparent 70%);' +
          'animation:cu-rotate 1s steps(12) infinite;' +
          (dark ? 'filter:invert(1);' : '')
      } else if (d.type === 'carousel') {
        patch.carouselBoxStyle = buildCarouselBoxStyle(d.size)
        patch.carouselDots = this.__carouselDots(0)
      }
      this.setData(patch)
    },

    __refreshTextStyle() {
      const {textColor, textSize} = this.data
      this.setData({
        textStyle: `color:${textColor};` + (textSize > 0 ? `font-size:${textSize}px;` : ''),
      })
    },

    __carouselDots(phase: number): string[] {
      const {size, color} = this.data
      const resolved = color || DEFAULT_COLOR
      return [0, 1, 2].map((i) => buildCarouselDotStyle(i, phase, size, resolved))
    },

    __syncCarouselTimer(type: string) {
      const state = indicatorState(this)
      state.timers.clearInterval(state.carouselTimer)
      state.carouselTimer = null
      if (type !== 'carousel') {
        return
      }
      let phase = 0
      state.carouselTimer = state.timers.setInterval(() => {
        phase = (phase + 1) % 7
        this.setData({carouselDots: this.__carouselDots(phase)})
      }, CAROUSEL_PHASE_INTERVAL)
    },

    /** 默认插槽内容探测（空槽时收起文字视图，对齐 Vue v-if="$slots.default"） */
    __probeTextSlot() {
      const query = this.createSelectorQuery()
      query.select('#cu-ai-text-probe').boundingClientRect()
      query.exec((res: Array<unknown | null>) => {
        if (res && res[0] === null) {
          return // 插槽有内容
        }
        this.setData({hasText: false})
      })
    },

    /** 对外暴露当前描边宽（内部换算，与 Vue computed 一致） */
    getStrokeWidth(): number {
      return resolveStrokeWidth(this.data.size, this.data.width)
    },
  },
})

interface IndicatorState {
  timers: TimerRegistry
  carouselTimer: number | null
}

function indicatorState(ctx: unknown): IndicatorState {
  const self = ctx as {__aiState?: IndicatorState}
  if (!self.__aiState) {
    self.__aiState = {timers: createTimerRegistry(ctx), carouselTimer: null}
  }
  return self.__aiState
}

function timers(ctx: unknown): TimerRegistry {
  return indicatorState(ctx).timers
}
