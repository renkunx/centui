/**
 * Source: packages/vue/src/components/water-mark/WaterMark.vue
 *
 * 映射：
 *  props    content(''), spacing('20vw'), repeatX(true), repeatY(true), rotate(-30),
 *           opacity(0.1)
 *  events   无（Vue 版无 emits）
 *  slots    默认插槽（water-mark-container 内容层）；watermark 具名插槽（平铺水印）
 *
 * 平台差异：
 *  1. Canvas 2D 新接口（type="2d"）：createSelectorQuery().in(this)
 *     .select('#cv').fields({node, size})，dpr 取 wx.getWindowInfo().pixelRatio；
 *     ratio = Math.max(dpr, 2)（对齐 Vue getDpr 下限）。绘制数学与 Vue 逐一对应：
 *     canvas 节点 CSS 尺寸 = 容器尺寸×ratio（对应 Vue 无约束 canvas 的 attribute
 *     尺寸语义），node.width/height 取同值，ctx.scale(1/ratio) 后按 Vue draw() 的
 *     用户空间换算平铺；「双乘修复」保持（computeTileCount 不再对 ctxWidth/ctxHeight
 *     重复乘 ratio）。
 *  2. content 变化重绘：对齐修复后 Vue 版 watch(content) → redraw（清屏重绘）；
 *     增强一处（有意差异）：Vue 版仅在 ctx 已初始化（初始 content 非空）时才会响应
 *     content 变化，本实现支持初始 content 为空、后续才设置内容的场景（先 initCanvas）。
 *  3. 作用域插槽（watermark 槽 coord={row,col}）无对应能力——同名插槽保留、不注入
 *     coord；hasWatermarkSlot 判定改为 ready 时对插槽包裹节点测量（Vue 为同步 slots
 *     判定，小程序侧首帧可能闪现空状态）。
 *  4. spacing 的 vw/vh 以 wx.getWindowInfo() 的 windowWidth/windowHeight 换算
 *     （Vue 为 window.screen.width/height）。
 *  5. ul/li 结构以 view 等价实现（类名与 Vue 版相同）；item 奇偶行内边距由
 *     buildWatermarkLines 按行展开（同一行内所有 item 样式一致，避免 setData
 *     2500 项大数组）。
 *  6. 根节点自足（position:relative + overflow:hidden，见 water-mark.styl），可被
 *     外层组件（如 bill）任意包裹。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  computeTileCount,
  resolveSpacing,
  spacingStyleOf,
  buildWatermarkLines,
  WATERMARK_COLOR,
  WATERMARK_FONT_SIZE,
  type WatermarkTiling,
} from './logic'

interface CanvasState {
  timers: TimerRegistry
  /** canvas type="2d" 上下文（getContext('2d') 返回类型） */
  ctx: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D | null
  node: WechatMiniprogram.Canvas | null
  /** 容器 CSS 尺寸（.water-mark-list 测量值） */
  containerWidth: number
  containerHeight: number
  ratio: number
  initialized: boolean
}

function state(ctx: unknown): CanvasState {
  const self = ctx as {__waterMarkState?: CanvasState}
  if (!self.__waterMarkState) {
    self.__waterMarkState = {
      timers: createTimerRegistry(ctx),
      ctx: null,
      node: null,
      containerWidth: 0,
      containerHeight: 0,
      ratio: 2,
      initialized: false,
    }
  }
  return self.__waterMarkState
}

function timers(ctx: unknown): TimerRegistry {
  return state(ctx).timers
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    content: {type: String, value: ''},
    /** CSS 长度串或数字（Vue spacing: string | number） */
    spacing: {type: null, value: '20vw'},
    repeatX: {type: Boolean, value: true},
    repeatY: {type: Boolean, value: true},
    /** CSS 长度串或数字（Vue rotate: string | number） */
    rotate: {type: null, value: -30},
    /** CSS 长度串或数字（Vue opacity: string | number） */
    opacity: {type: null, value: 0.1},
  },

  data: {
    hasWatermark: false,
    hasWatermarkSlot: false,
    /** wrapper 内联样式：opacity + rotate（Vue :style 同式） */
    wrapperStyle: 'opacity:0.1;transform:rotate(-30deg)',
    canvasStyle: '',
    /** 水印插槽平铺视图（buildWatermarkLines，item 样式按行展开） */
    tiling: {lineStyles: [], itemStyles: [], itemCount: 1} as WatermarkTiling,
    itemIndexes: [] as number[],
    spacingStyle: '20vw',
    repeatXView: true,
  },

  observers: {
    'repeatX, repeatY, spacing'() {
      this.__refreshTiling()
    },
    'rotate, opacity'(rotate: string | number, opacity: string | number) {
      this.setData({
        wrapperStyle: `opacity:${opacity};transform:rotate(${rotate}deg)`,
      })
    },
    content(val: string, oldVal: string) {
      // 对齐修复后 Vue 版 watch(content)：同值不重绘；hasWatermark 同步
      // （Vue 为 hasWatermark = hasWatermarkSlot || !!content computed）
      this.setData({hasWatermark: !!val || this.data.hasWatermarkSlot})
      if (val === oldVal) {
        return
      }
      if (!val) {
        return
      }
      if (!state(this).initialized) {
        // 有意增强（见头注释差异 2）：初始 content 为空时 canvas 尚未初始化
        this.__initCanvas()
        return
      }
      this.__redraw()
    },
  },

  lifetimes: {
    attached() {
      this.__refreshTiling()
      this.setData({
        wrapperStyle: `opacity:${this.data.opacity};transform:rotate(${this.data.rotate}deg)`,
        hasWatermark: !!this.data.content,
      })
    },
    ready() {
      this.__probeWatermarkSlot()
      if (this.data.content) {
        this.__initCanvas()
      }
    },
    detached() {
      timers(this).clearAll()
    },
  },

  methods: {
    /** 水印插槽有无探测（Vue hasWatermarkSlot computed 的异步近似） */
    __probeWatermarkSlot() {
      if (this.data.content || this.data.hasWatermark) {
        return
      }
      this.createSelectorQuery()
        .select('.water-mark-slot-probe')
        .boundingClientRect((rect: {height: number} | null) => {
          if (rect && rect.height > 0) {
            this.setData({hasWatermarkSlot: true, hasWatermark: true})
          }
        })
        .exec()
    },

    __refreshTiling() {
      const d = this.data
      const tiling = buildWatermarkLines(!!d.repeatX, !!d.repeatY, d.spacing)
      const itemIndexes: number[] = []
      for (let i = 0; i < tiling.itemCount; i++) {
        itemIndexes.push(i)
      }
      this.setData({
        tiling,
        itemIndexes,
        spacingStyle: spacingStyleOf(d.spacing),
        repeatXView: !!d.repeatX,
      })
    },

    /** Vue onMounted → initCanvas + computedSpacing + draw */
    __initCanvas() {
      const st = state(this)
      if (st.initialized) {
        return
      }
      const query = this.createSelectorQuery()
      query.select('.water-mark-list').boundingClientRect()
      query.select('#cv').fields({node: true, size: true})
      query.exec((res: Array<Record<string, unknown> | null> | null) => {
        const rect = res && res[0]
        const cvField = res && res[1]
        const node = (cvField && cvField.node) as WechatMiniprogram.Canvas | null
        if (!rect || !node) {
          return
        }
        const info = wx.getWindowInfo()
        st.ratio = Math.max(info.pixelRatio || 2, 2) // min ratio = 2（对齐 Vue）
        st.containerWidth = (rect.width as number) || 0
        st.containerHeight = (rect.height as number) || 0
        st.node = node
        // Vue initCanvas：canvas 尺寸 = 容器×ratio（attribute 即 CSS 尺寸），
        // ctx.scale(1/ratio, 1/ratio) 后用户空间与 Vue draw() 完全一致
        const width = Math.round(st.containerWidth * st.ratio)
        const height = Math.round(st.containerHeight * st.ratio)
        node.width = width
        node.height = height
        this.setData({canvasStyle: `width:${width}px;height:${height}px;`})
        const ctx = node.getContext('2d')
        if (!ctx) {
          return
        }
        ctx.scale(1 / st.ratio, 1 / st.ratio)
        st.ctx = ctx
        st.initialized = true
        this.__draw()
      })
    },

    /** Vue draw()：平铺 content 文本 */
    __draw() {
      const st = state(this)
      const ctx = st.ctx
      const content = this.data.content as string
      if (!ctx || !content) {
        return
      }
      const info = wx.getWindowInfo()
      const ctxWidth = st.containerWidth * st.ratio
      const ctxHeight = st.containerHeight * st.ratio
      const contentLength = content.length * WATERMARK_FONT_SIZE * st.ratio
      const realSpacing =
        resolveSpacing(this.data.spacing, info.windowWidth, info.windowHeight) * st.ratio
      const fontSize = WATERMARK_FONT_SIZE * st.ratio
      const {xCount, yCount} = computeTileCount(
        ctxWidth,
        ctxHeight,
        contentLength,
        realSpacing,
        fontSize,
      )
      ctx.font = `${fontSize}px "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif`
      ctx.fillStyle = WATERMARK_COLOR
      let ctxY = 0
      for (let y = 0; y < yCount; y++) {
        let ctxX = 0
        for (let x = 0; x < xCount; x++) {
          ctx.fillText(content, ctxX, ctxY)
          ctxX += contentLength
        }
        ctxY += fontSize + realSpacing
      }
    },

    /** Vue redraw()：清屏后按当前 props 重绘 */
    __redraw() {
      const st = state(this)
      if (!st.node || !st.ctx) {
        return
      }
      st.ctx.clearRect(0, 0, st.node.width, st.node.height)
      this.__draw()
    },
  },
})
