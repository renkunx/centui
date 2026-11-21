/**
 * Source: packages/vue/src/components/number-keyboard/{NumberKeyboard,KeyboardBoard,KeyboardKey}.vue
 *
 * 三文件合并为单组件（KeyboardBoard 键区数据经 logic.ts 纯函数产出，KeyboardKey
 * 归一化为 KeyCell 视图；事件契约与 codebox 的 cu-number-keyboard 接线对齐）。
 *
 * 映射：
 *  props    modelValue→show(false), type(''→professional), isView(false), hideDot(false),
 *           disorder(false), isHideConfirm(true), disabled(false), okText(null→「确定」),
 *           duplicateZero(false)
 *  events   update:modelValue→change({value})；enter({value})（Vue 载荷为裸值，小程序统一
 *           detail 对象——codebox 兼容读取）；delete / confirm / show / hide
 *  slots    默认插槽（键盘上方自定义内容，.cu-number-keyboard-slot）
 *  methods  show() / hide()
 *
 * 平台差异（有意为之）：
 *  1. textRender 函数 prop 无平台等价（函数不可经 setData/property 传递），不支持；
 *     键值统一字符串化（logic.generateKeyNumberList）。如需自定义键位文案请在外部处理 enter 值。
 *  2. 无 popup 时（isView）键区直接内联渲染；弹层路径走 cu-popup（bottom、无遮罩），
 *     z-index 经 number-keyboard.wxss 的 .cu-number-keyboard .cu-popup 规则（shared 隔离）。
 *  3. 键位按压视觉：touchstart 加 active、touchend/touchcancel/touchmove 移除（Vue
 *     KeyboardKey touch 语义）；no-touch 键（slidedown/confirm）经 tap 触发。
 *  4. 键区容器 catch:touchmove 锁滚动穿透（Vue @touchmove.prevent）。
 *  5. disorder 键位在 attached 时生成一次（对齐 Vue setup 期 generateKeyNumber），
 *     运行期改 disorder 不重排（Vue 亦不响应）。
 */
import {CuComponent} from '../../shared/component'
import {
  buildNumberKeys,
  buildOperateKeys,
  generateKeyNumberList,
  NUMBER_KEYBOARD_CONFIRM_TEXT,
  type KeyCell,
} from './logic'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue（受控显隐；isView 时无效） */
    show: {type: Boolean, value: false},
    /** simple | professional（空取 professional，对齐 KeyboardBoard 默认） */
    type: {type: String, value: ''},
    isView: {type: Boolean, value: false},
    hideDot: {type: Boolean, value: false},
    disorder: {type: Boolean, value: false},
    /** confirm 后自动收起（Vue isHideConfirm 默认 true） */
    isHideConfirm: {type: Boolean, value: true},
    disabled: {type: Boolean, value: false},
    /** null → locale「确定」（Vue props.okText ?? t(...)） */
    okText: {type: String, value: null},
    duplicateZero: {type: Boolean, value: false},
  },

  data: {
    __lastInnerShow: false,
    innerShow: false,
    resolvedType: 'professional',
    okTextResolved: NUMBER_KEYBOARD_CONFIRM_TEXT,
    keyNumberList: [] as string[],
    numberKeys: [] as KeyCell[],
    operateKeys: [] as KeyCell[],
    activeKey: -1,
    activeOperate: -1,
  },

  observers: {
    show(v: boolean) {
      this.setData({innerShow: v})
    },
    innerShow(v: boolean) {
      // 同值短路：真机 observers 在 setData 相同值时也会触发（与测试桩「值变化才触发」
      // 语义分叉），外部回写 show property 会经 show→innerShow→change→外部 setData
      // 形成 setProperty→observer→event→setProperty 死循环（实测拖垮模拟器渲染进程）
      if (v === this.data.__lastInnerShow) {
        return
      }
      this.setData({__lastInnerShow: v})
      // Vue watch(isKeyboardShow) → emit update:modelValue
      this.triggerEvent('change', {value: v})
    },
    okText(val: string) {
      this.setData({okTextResolved: val ?? NUMBER_KEYBOARD_CONFIRM_TEXT})
    },
    'type, hideDot, duplicateZero, isView'() {
      this.__rebuild()
    },
  },

  lifetimes: {
    attached() {
      // Vue generateKeyNumber：创建期生成一次（乱序同样仅此一次）
      this.setData({
        innerShow: this.data.show,
        keyNumberList: generateKeyNumberList(this.data.disorder),
        okTextResolved: this.data.okText ?? NUMBER_KEYBOARD_CONFIRM_TEXT,
      })
      this.__rebuild()
    },
  },

  methods: {
    __rebuild() {
      const resolvedType = this.data.type === 'simple' ? 'simple' : 'professional'
      const keyNumberList =
        this.data.keyNumberList.length === 10
          ? this.data.keyNumberList
          : generateKeyNumberList(this.data.disorder)
      this.setData({
        resolvedType,
        keyNumberList,
        numberKeys: buildNumberKeys({
          type: resolvedType,
          keyNumberList,
          hideDot: this.data.hideDot,
          duplicateZero: this.data.duplicateZero,
          isView: this.data.isView,
        }),
        operateKeys:
          resolvedType === 'professional'
            ? buildOperateKeys(this.data.okTextResolved)
            : [],
      })
    },

    /** §6 一等 API */
    show() {
      this.setData({innerShow: true})
    },

    hide() {
      this.setData({innerShow: false})
    },

    /** Vue onPopupInput：popup 关闭回流 → isKeyboardShow=false（change 由 observer 派发） */
    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail.value) return
      this.setData({innerShow: false})
    },

    onPopupShow() {
      this.triggerEvent('show')
    },

    onPopupHide() {
      this.triggerEvent('hide')
    },

    /** KeyboardKey onFocus(touch)：active + press（仅 touch 键；disabled 阻断） */
    onKeyTouchStart(e: WechatMiniprogram.TouchEvent) {
      const {zone, index} = e.currentTarget.dataset as {zone: string; index: number}
      const idx = Number(index)
      if (zone === 'operate') this.setData({activeOperate: idx})
      else this.setData({activeKey: idx})
      const cell =
        zone === 'operate' ? this.data.operateKeys[idx] : this.data.numberKeys[idx]
      if (cell?.touch) this.__press(zone, idx)
    },

    /** KeyboardKey onBlur */
    onKeyTouchEnd(e: WechatMiniprogram.TouchEvent) {
      const {zone} = e.currentTarget.dataset as {zone: string}
      if (zone === 'operate') this.setData({activeOperate: -1})
      else this.setData({activeKey: -1})
    },

    /** no-touch 键（slidedown/confirm）经 tap 触发（Vue KeyboardKey onFocus(click)） */
    onKeyTap(e: WechatMiniprogram.BaseEvent) {
      const {zone, index} = e.currentTarget.dataset as {zone: string; index: number}
      const idx = Number(index)
      const cell =
        zone === 'operate' ? this.data.operateKeys[idx] : this.data.numberKeys[idx]
      if (cell && !cell.touch) this.__press(zone, idx)
    },

    __press(zone: string, index: number) {
      if (this.data.disabled) return
      const cell =
        zone === 'operate' ? this.data.operateKeys[index] : this.data.numberKeys[index]
      if (!cell) return
      switch (cell.kind) {
        case 'number':
        case 'dot':
          this.triggerEvent('enter', {value: cell.value})
          break
        case 'delete':
          this.triggerEvent('delete')
          break
        case 'slidedown':
          // KeyboardBoard onSlideDoneClick → emit hide
          this.hide()
          break
        case 'confirm':
          this.triggerEvent('confirm')
          if (this.data.isHideConfirm) this.hide()
          break
        default:
          break
      }
    },

    noop() {},
  },
})
