/**
 * Source: packages/vue/src/components/icon/Icon.vue + default-svg-list.ts
 *
 * 映射：
 *  props    name, size(xss/xs/sm/md/lg), color, svg（Web 语义 no-op，统一走 svg-mask）
 *  events   click
 *
 * 平台差异：
 *  小程序无 SVG DOM，sprite+<use> 改为 iconfont 渲染：icon.styl 自带
 *  Mand-Mobile-Icon @font-face（token --icon-font-family 远程 woff/ttf）与
 *  .cu-icon-<name>:before 码点表，颜色走 color 继承（等价 Web 版 currentColor）。
 *  ★ 渲染策略实测说明：开发者工具渲染层（3.8.0）不支持 CSS mask-image
 *  （svg/png、标准/-webkit- 前缀均被忽略，见 demo 探针实验），故放弃
 *  mask-image + data-URI 方案改用 iconfont。代价：字体远程加载首帧可能闪现
 *  方块（与 Web 版 icon-font 分支一致）；ICON_MAP（构建期 default-svg-list
 *  求值产物）仅用于未知图标名告警。SMIL 自旋转图标由平台 shim 的 CSS 旋转
 *  近似（global.wxss）。
 */
import {CuComponent} from '../../shared/component'
import {ICON_MAP} from '../../shared/icon-map'

CuComponent({
  options: {virtualHost: true},

  properties: {
    name: {type: String, value: ''},
    /** xss | xs | sm | md | lg */
    size: {type: String, value: 'md'},
    color: {type: String, value: ''},
    /** Web 语义 no-op */
    svg: {type: Boolean, value: true},
  },

  data: {
    iconStyle: '',
  },

  observers: {
    'name, color'() {
      this.__renderIcon()
    },
  },

  lifetimes: {
    attached() {
      // observers 不在初始值时触发：初始 name/color 需在此派生
      // （缺失会导致初始渲染的图标无 mask-image 而不可见）
      this.__renderIcon()
    },
  },

  methods: {
    __renderIcon() {
      const {name, color} = this.data as {name: string; color: string}
      if (!name) {
        this.setData({iconStyle: ''})
        return
      }
      // iconfont 渲染：字形由 icon.styl 的 .cu-icon-<name>:before content 码点提供，
      // 颜色走 color（继承父级，等价 Web 版 currentColor）；ICON_MAP 仅用于未知名告警
      if (!ICON_MAP[name]) {
        console.warn(`[CentUI] icon: 未知图标名 "${name}"`)
      }
      this.setData({iconStyle: color ? `color:${color};` : ''})
    },

    onTap() {
      this.triggerEvent('click')
    },
  },
})
