/**
 * Source: packages/vue/src/components/cashier/{Cashier,CashierChannel,CashierChannelItem,CashierChannelButton}.vue
 *
 * 四文件合并为单组件（channel/channel-item/channel-button 的样式全部位于 cashier.styl，
 * 无需独立组件目录；channel-item 内联渲染）。
 *
 * 映射：
 *  props    modelValue→show(false), channels([]), channelLimit(2), defaultIndex(0),
 *           paymentTitle('支付金额（元）'), paymentAmount('0.00'), paymentDescribe(''),
 *           payButtonText('确定支付'), payButtonDisabled(false),
 *           moreButtonText('更多支付方式'), title('支付'), describe(''), largeRadius(false)
 *  events   update:modelValue→change({value})；select({item, index})（Vue 载荷为 item，
 *           index 为附加字段）；pay({item})；show / hide / cancel
 *  slots    header（Vue 作用域插槽 scene 参数——无作用域插槽，改为组件 data.scene +
 *           change/next 事件同步，差异声明）；channel；payButton（约定与 payButtonText
 *           二选一，同时提供时两者都渲染）；scene（custom 场景）；footer
 *  methods  next(scene, option)（defineExpose 对齐）；show()/hide()
 *
 * 场景状态机（对齐 Vue Cashier.vue）：choose → next('captcha'|'loading'|'success'|'fail'|'custom')
 * → popup hide 时 resetCashier 回 choose。sceneOption 默认值（loading/success/fail/captcha）
 * 与 locale 文案逐字对齐；handler 函数（captcha.onSend/onSubmit、success/fail 的
 * handler/actions、channel.action.handler）登记在实例状态，不进 setData。
 *
 * 平台差异（有意为之）：
 *  1. 无 teleport：popup 渲染在组件位置；盒底色/圆角经 cashier.wxss 的
 *     .cu-cashier .cu-popup-box 规则（shared 隔离）承担（Vue 为 inner-popup/large-radius
 *     类透传 + popup.styl，视觉同 token）。
 *  2. 标题栏为 cu-popup-title-bar（only-close large-radius title-align 左），基础样式
 *     见该组件差异声明。
 *  3. paymentTitle/paymentAmount/paymentDescribe/moreButtonText/渠道 text/desc/action.text
 *     为 v-html → <rich-text>（§8）。
 *  4. loading/success 场景的 RollerSuccess → cu-activity-indicator(type=roller, is-success)。
 *  5. captcha 场景内嵌 cu-captcha（is-view），send/submit 转发到 sceneOption 回调。
 *  6. header/footer 作用域插槽的 scene 参数不可达（小程序无作用域插槽），通过事件与
 *     selectComponent 读 data.scene 获取。
 */
import {CuComponent} from '../../shared/component'
import {
  buildChannelViews,
  CASHIER_TEXT,
  isSingleChannel,
  mergeSceneOption,
  resolveSceneActions,
  stripFunctions,
  type CashierChannel,
  type CashierScene,
} from './logic'

interface CashierState {
  /** handler 函数登记（不进 setData）：captcha 回调 / 场景按钮 / 渠道 action */
  captchaOnSend?: () => void
  captchaOnSubmit?: (code: string) => void
  successHandlers: Array<(() => void) | null | undefined>
  failHandlers: Array<(() => void) | null | undefined>
  channelActionHandlers: Array<(() => void) | undefined>
  channels: CashierChannel[]
}

function state(ctx: unknown): CashierState {
  const self = ctx as {__cashierState?: CashierState}
  if (!self.__cashierState) {
    self.__cashierState = {
      successHandlers: [],
      failHandlers: [],
      channelActionHandlers: [],
      channels: [],
    }
  }
  return self.__cashierState
}

const DEFAULT_SCENE_OPTION = () => ({
  loading: {text: CASHIER_TEXT.payResultSearch},
  success: {text: CASHIER_TEXT.paySuccess, buttonText: CASHIER_TEXT.confirm},
  fail: {text: CASHIER_TEXT.payFail, buttonText: CASHIER_TEXT.confirm},
  captcha: {
    text: '',
    brief: '',
    maxlength: 4,
    count: 60,
    autoCountdown: true,
    countNormalText: '',
    countActiveText: '',
  },
})

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue（受控显隐） */
    show: {type: Boolean, value: false},
    channels: {type: Object, value: [] as CashierChannel[]},
    channelLimit: {type: Number, value: 2},
    defaultIndex: {type: Number, value: 0},
    paymentTitle: {type: String, value: CASHIER_TEXT.payCash},
    paymentAmount: {type: String, value: '0.00'},
    paymentDescribe: {type: String, value: ''},
    payButtonText: {type: String, value: CASHIER_TEXT.confirmPay},
    payButtonDisabled: {type: Boolean, value: false},
    moreButtonText: {type: String, value: CASHIER_TEXT.morePayWays},
    title: {type: String, value: CASHIER_TEXT.pay},
    describe: {type: String, value: ''},
    largeRadius: {type: Boolean, value: false},
  },

  data: {
    innerShow: false,
    scene: 'choose' as CashierScene,
    sceneKey: 0,
    sceneOption: DEFAULT_SCENE_OPTION(),
    activeChannelIndex: 0,
    isChannelShow: false,
    isChannelActive: false,
    isSingle: true,
    channelViews: [] as ReturnType<typeof buildChannelViews>,
    defaultChannelView: null as ReturnType<typeof buildChannelViews>[number] | null,
    successActions: [] as Array<{buttonText: string}>,
    failActions: [] as Array<{buttonText: string}>,
  },

  observers: {
    show(v: boolean) {
      this.setData({innerShow: v})
    },
    innerShow(v: boolean) {
      // Vue watch(isCashierShow) → emit update:modelValue
      this.triggerEvent('change', {value: v})
    },
    'channels, channelLimit, defaultIndex'() {
      this.__refreshChannels()
    },
    'activeChannelIndex, channels'() {
      this.__refreshActive()
    },
  },

  lifetimes: {
    attached() {
      const st = state(this)
      st.channels = (this.data.channels ?? []) as CashierChannel[]
      this.setData({
        innerShow: this.data.show,
        activeChannelIndex: this.data.defaultIndex,
        sceneOption: DEFAULT_SCENE_OPTION(),
      })
      this.__refreshChannels()
      this.__refreshActive()
    },
  },

  methods: {
    // ------------------------------------------------------------------
    // 渠道视图
    // ------------------------------------------------------------------
    __refreshChannels() {
      const st = state(this)
      st.channels = ((this.data.channels ?? []) as CashierChannel[]).map(item => item ?? {})
      // channel.action.handler 登记（函数不进 setData）
      st.channelActionHandlers = st.channels.map(
        channel =>
          (typeof channel.action?.handler === 'function'
            ? channel.action!.handler
            : undefined) as (() => void) | undefined,
      )
      this.setData({
        isSingle: isSingleChannel(st.channels, this.data.channelLimit),
        channelViews: buildChannelViews(st.channels, this.data.activeChannelIndex),
        defaultChannelView: st.channels[this.data.defaultIndex]
          ? buildChannelViews([st.channels[this.data.defaultIndex]], this.data.defaultIndex)[0]
          : null,
      })
    },

    __refreshActive() {
      this.setData({
        channelViews: buildChannelViews(state(this).channels, this.data.activeChannelIndex),
      })
    },

    // ------------------------------------------------------------------
    // 显隐（Vue v-model / @show / @hide / @cancel）
    // ------------------------------------------------------------------
    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail.value) return
      // Vue：popup input false → isCashierShow=false（observer 再 emit change）
      this.setData({innerShow: false})
    },

    onPopupShow() {
      this.triggerEvent('show')
    },

    onPopupHide() {
      // Vue onPopupHide：resetCashier + emit hide
      this.setData({scene: 'choose', sceneKey: Date.now()})
      this.triggerEvent('hide')
    },

    onPopupCancel() {
      // Vue onPopupCancel：isCashierShow=false + emit cancel
      this.setData({innerShow: false})
      this.triggerEvent('cancel')
    },

    /** §6 一等 API */
    show() {
      this.setData({innerShow: true})
    },

    hide() {
      this.setData({innerShow: false})
    },

    // ------------------------------------------------------------------
    // 场景状态机（Vue defineExpose next）
    // ------------------------------------------------------------------
    next(nextScene: CashierScene, option: Record<string, unknown> = {}) {
      const st = state(this)
      const merged = mergeSceneOption(
        this.data.sceneOption as unknown as Record<string, Record<string, unknown>>,
        nextScene,
        option,
      )
      // handler 登记
      if (nextScene === 'captcha') {
        if (typeof option.onSend === 'function') st.captchaOnSend = option.onSend as () => void
        if (typeof option.onSubmit === 'function') {
          st.captchaOnSubmit = option.onSubmit as (code: string) => void
        }
      }
      if (nextScene === 'success') this.__registerSceneHandlers('success', option)
      if (nextScene === 'fail') this.__registerSceneHandlers('fail', option)
      // 可序列化快照进 data（actions 内嵌 handler 已剥离）
      const sceneOption = stripFunctions(merged)
      const patch: Record<string, unknown> = {scene: nextScene, sceneKey: Date.now(), sceneOption}
      if (nextScene === 'success') {
        patch.successActions = resolveSceneActions(
          sceneOption.success as unknown as {
            actions?: Array<{buttonText?: string; handler?: (() => void) | null}>
            buttonText?: string
          },
          CASHIER_TEXT.confirm,
        )
      }
      if (nextScene === 'fail') {
        patch.failActions = resolveSceneActions(
          sceneOption.fail as unknown as {
            actions?: Array<{buttonText?: string; handler?: (() => void) | null}>
            buttonText?: string
          },
          CASHIER_TEXT.confirm,
        )
      }
      this.setData(patch)
    },

    __registerSceneHandlers(
      scene: 'success' | 'fail',
      option: Record<string, unknown>,
    ) {
      const st = state(this)
      if (Array.isArray(option.actions)) {
        st[scene === 'success' ? 'successHandlers' : 'failHandlers'] = (
          option.actions as Array<{handler?: (() => void) | null}>
        ).map(action => action?.handler ?? null)
      } else if (typeof option.handler !== 'undefined') {
        st[scene === 'success' ? 'successHandlers' : 'failHandlers'] = [
          (option.handler as (() => void) | null) ?? null,
        ]
      } else {
        st[scene === 'success' ? 'successHandlers' : 'failHandlers'] = []
      }
    },

    onSceneActionTap(e: WechatMiniprogram.BaseEvent) {
      const scene = (e.currentTarget.dataset as {scene: 'success' | 'fail'}).scene
      const index = Number((e.currentTarget.dataset as {index: number}).index)
      const st = state(this)
      const handler = (scene === 'success' ? st.successHandlers : st.failHandlers)[index]
      if (typeof handler === 'function') handler()
    },

    onSceneSend() {
      state(this).captchaOnSend?.()
    },

    onSceneSubmit(e: WechatMiniprogram.CustomEvent<{value: string}>) {
      state(this).captchaOnSubmit?.(e.detail.value)
    },

    // ------------------------------------------------------------------
    // 渠道（CashierChannel 语义）
    // ------------------------------------------------------------------
    onChannelItemClick(e: WechatMiniprogram.BaseEvent) {
      const index = Number((e.currentTarget.dataset as {index: number}).index)
      const item = state(this).channels[index]
      if (!item || item.disabled) return
      this.setData({activeChannelIndex: index})
      this.triggerEvent('select', {item, index})
    },

    onChannelMoreClick() {
      if (this.data.isChannelActive) return
      this.setData({isChannelShow: true})
      Promise.resolve().then(() => {
        this.setData({isChannelActive: true})
      })
    },

    onChannelActionTap(e: WechatMiniprogram.BaseEvent) {
      const index = Number((e.currentTarget.dataset as {index: number}).index)
      const handler = state(this).channelActionHandlers[index]
      if (typeof handler === 'function') handler()
    },

    onChannelBtnClick() {
      const item = state(this).channels[this.data.activeChannelIndex]
      this.triggerEvent('pay', {item})
    },

    noop() {},
  },
})
