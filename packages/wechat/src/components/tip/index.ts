/**
 * Source: packages/vue/src/components/tip/Tip.vue + TipContent.vue + index.ts
 *
 * 映射：
 *  props    placement('top'), name(String|Number), icon(''), iconSvg(false, no-op
 *           ——小程序统一 svg-mask 渲染), content(String|Number, ''), closable(true),
 *           fill(false), offset({top:0,left:0})
 *  events   show({name}) / hide({name})（Vue 载荷为 name 裸值，小程序统一 detail 对象）
 *  slots    默认插槽 = 触发元素（Vue 只渲染第一个节点并追加点击，小程序无 vnode 克隆，
 *           改为整包渲染在可点击的触发容器内）；具名 content 插槽 = TipContent 默认插槽
 *           （content/icon 均未传时启用）
 *  methods  show()/hide()（§6 一等 API）
 *
 * 命令式 API（页面需放置 <cu-tip id="cu-tip" />，锚点即组件所在位置）：
 *   import {Tip} from '.../components/tip/index'
 *   Tip(this, '提示内容', {placement: 'bottom'})   // 显示
 *   Tip.hide(this)                                 // 关闭
 *
 * 平台差异（有意为之）：
 *  1. Vue 版把气泡游离 DOM 插入「第一个可滚动祖先」（getFirstScrollWrapper + absolute 定位）；
 *     小程序无 DOM 搬运，气泡以 fixed 定位（createSelectorQuery 测量触发元素与气泡实际
 *     尺寸后计算，与 Vue layout() 同一公式；10px 间隙为 Vue 源字面量）。z-index 走 token
 *     （tip.wxss 的 .cu-tip 规则）。
 *  2. Vue 版点击触发即 show（非 toggle），关闭仅经气泡关闭图标——行为保持一致。
 *  3. TipContent 的 icon/content 与默认插槽互斥渲染（Vue 为 $slots.default 判定）；
 *     小程序以 content/icon 是否传值判定，插槽走具名 content（无插槽探测能力）。
 *  4. 气泡首次显示需一帧测量后定位（setData 两次），无 Web 的同步 cssText。
 */
import {CuComponent} from '../../shared/component'
import {buildWrapperCls, computeTipStyle, type TipOffset, type TipPlacement} from './logic'

interface TipState {
  name?: string | number
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** top | left | bottom | right */
    placement: {type: String, value: 'top'},
    /** 事件载荷与气泡类名（Vue name prop） */
    name: {type: String, optionalTypes: [Number], value: ''},
    icon: {type: String, value: ''},
    /** Web 语义 no-op（小程序 icon 统一 svg-mask 渲染） */
    iconSvg: {type: Boolean, value: false},
    content: {type: String, optionalTypes: [Number], value: ''},
    closable: {type: Boolean, value: true},
    fill: {type: Boolean, value: false},
    offset: {type: Object, value: {top: 0, left: 0}},
  },

  data: {
    visible: false,
    layerStyle: '',
    wrapperCls: '',
  },

  lifetimes: {
    detached() {
      // 无定时器/全局登记；气泡节点随组件销毁
    },
  },

  methods: {
    /**
     * 显示气泡（Vue show()：懒创建 + 插入滚动祖先 + layout + emit show）。
     * options 可覆盖 content/icon/placement/closable/fill/offset/name（命令式用法）。
     */
    show(options: Record<string, unknown> = {}) {
      const serializable: Record<string, unknown> = {}
      for (const key of ['content', 'icon', 'placement', 'closable', 'fill', 'offset', 'name']) {
        if (options[key] !== undefined) serializable[key] = options[key]
      }
      if (Object.keys(serializable).length) this.setData(serializable)
      const state = this as unknown as WechatMiniprogram.Component.TrivialInstance & {
        __tipState?: TipState
      }
      state.__tipState = {name: this.data.name}
      this.setData({
        visible: true,
        wrapperCls: buildWrapperCls(this.data.closable, this.data.placement, this.data.name),
      })
      this.__layout()
      this.triggerEvent('show', {name: this.data.name})
    },

    /** 关闭气泡（Vue hide()：移除气泡 + emit hide） */
    hide() {
      if (!this.data.visible) return
      this.setData({visible: false, layerStyle: ''})
      this.triggerEvent('hide', {name: this.data.name})
    },

    /** 触发元素点击（Vue cloneVNode onClick: show） */
    onTriggerTap() {
      this.show()
    },

    onClose() {
      this.hide()
    },

    /** Vue layout()：测量触发元素与气泡，计算 fixed 定位 */
    __layout() {
      wx.nextTick(() => {
        if (!this.data.visible) return
        const query = this.createSelectorQuery()
        query.select('.cu-tip-root').boundingClientRect()
        query.select('.cu-tip-bubble').boundingClientRect()
        query.exec(rects => {
          if (!this.data.visible) return
          const refRect = rects?.[0]
          const tipRect = rects?.[1]
          if (!refRect || !tipRect) return
          const style = computeTipStyle(
            this.data.placement as TipPlacement,
            refRect as {width: number; height: number; left: number; top: number},
            tipRect as {width: number; height: number},
            (this.data.offset ?? {}) as TipOffset,
            this.data.fill,
          )
          this.setData({layerStyle: style})
        })
      })
    },

    noop() {},
  },
})

// ---------------------------------------------------------------------------
// 命令式工厂
// ---------------------------------------------------------------------------

type Context = WechatMiniprogram.Component.TrivialInstance

const DEFAULT_SELECTOR = '#cu-tip'

function resolve(context: Context, selector?: string) {
  const inst = context.selectComponent(selector ?? DEFAULT_SELECTOR)
  if (!inst) {
    console.warn('[CentUI] Tip: 未找到 <cu-tip>，请在页面 wxml 放置 <cu-tip id="cu-tip" />')
  }
  return inst
}

/**
 * Tip factory
 * @param context 页面或组件实例
 * @param content 提示内容
 * @param options icon/placement/closable/fill/offset/name
 * @param selector 默认 '#cu-tip'
 */
const Tip = (
  context: Context,
  content: string | number = '',
  options: Record<string, unknown> = {},
  selector?: string,
) => {
  const inst = resolve(context, selector)
  inst?.show({...options, content})
  return inst
}

Tip.hide = (context: Context, selector?: string) => {
  resolve(context, selector)?.hide()
}

export {Tip}
export default Tip
