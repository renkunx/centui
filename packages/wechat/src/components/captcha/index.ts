/**
 * Source: packages/vue/src/components/captcha/Captcha.vue
 *
 * 映射：
 *  props    modelValue→show(false), title(''), subtitle(''), brief(''), maxlength(4),
 *           mask(false), system(false), autoSend(true), autoCountdown(true), count(60),
 *           countNormalText('发送验证码'), countActiveText('{$1}s 后重发'), isView(false),
 *           type('dialog'，inline|halfScreen|dialog), inputType('tel'), disableSend(false)
 *  events   update:modelValue→change({value})；show / hide；submit({value: code})；
 *           send（Vue 载荷为 countdown 函数——小程序事件不可携带函数，改为暴露
 *           countdown() 方法由外部调用，见差异 4）
 *  slots    默认插槽（提示信息，.cu-captcha-message / half-content）
 *  methods  countdown() / resetcount() / setError(msg) / close()（defineExpose 对齐，
 *           listenResize 无平台等价见差异 3）
 *
 * 平台差异（有意为之）：
 *  1. codebox 为 cu-codebox（is-view 只读展示）；关闭弹出后 codebox 的 focus/blur 调用
 *     以 selectComponent('#cu-captcha-codebox') 完成。
 *  2. 倒计时 setInterval 走 shared/timer 登记，detached 全量清理（§8）。
 *  3. Android 键盘高度监听（window resize listenResize）→ wx.onKeyboardHeightChange
 *     （halfScreen 的 isKeyboard/halfStyle）；detached 时 off，无平台等价差异。
 *  4. emit('send', countdown) 的函数载荷改为 send 无载荷 + countdown() 方法（可测）。
 *  5. z-index 经 captcha.wxss 的 .cu-captcha .cu-dialog .cu-popup 规则（shared 隔离）；
 *     halfScreen 标题栏为 cu-popup-title-bar（only-close large-radius title-align left）。
 *  6. Vue onMounted 的首次 emitSend 时机：show=true 挂载或 isInline 时触发；此后首次
 *     show 时触发（watch modelValue，对齐）。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {optimisticUpdate} from '../../shared/controlled'
import {CAPTCHA_TEXT, computeCountdown} from './logic'

interface CaptchaState {
  timers: TimerRegistry
  counterId: number | null
  countStart: number
  firstShown: boolean
  kbHandler: ((res: {height: number}) => void) | null
}

function state(ctx: unknown): CaptchaState {
  const self = ctx as {__captchaState?: CaptchaState}
  if (!self.__captchaState) {
    self.__captchaState = {
      timers: createTimerRegistry(ctx),
      counterId: null,
      countStart: 0,
      firstShown: false,
      kbHandler: null,
    }
  }
  return self.__captchaState
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue（受控显隐） */
    show: {type: Boolean, value: false},
    title: {type: String, value: ''},
    subtitle: {type: String, value: ''},
    brief: {type: String, value: ''},
    maxlength: {type: Number, optionalTypes: [String], value: 4},
    mask: {type: Boolean, value: false},
    system: {type: Boolean, value: false},
    autoSend: {type: Boolean, value: true},
    autoCountdown: {type: Boolean, value: true},
    count: {type: Number, optionalTypes: [String], value: 60},
    countNormalText: {type: String, value: CAPTCHA_TEXT.sendCaptcha},
    countActiveText: {type: String, value: CAPTCHA_TEXT.countdown},
    isView: {type: Boolean, value: false},
    /** inline | halfScreen | dialog */
    type: {type: String, value: 'dialog'},
    inputType: {type: String, value: 'tel'},
    disableSend: {type: Boolean, value: false},
  },

  data: {
    code: '',
    errorMsg: '',
    isCounting: false,
    countBtnText: CAPTCHA_TEXT.sendCaptcha as string,
    isInline: false,
    isShowErrorStyle: false,
    isKeyboard: false,
    innerShow: false,
  },

  observers: {
    /** 外部更新 countNormalText 时，非倒计时态的按钮文案同步（demo2 首发后"重新发送"场景） */
    'countNormalText, isCounting'(countNormalText: string, isCounting: boolean) {
      if (!isCounting && this.data.countBtnText !== countNormalText) {
        this.setData({countBtnText: countNormalText})
      }
    },
    show(val: boolean) {
      this.setData({innerShow: val})
      if (val) {
        this.setData({code: ''})
        const st = state(this)
        if (!st.firstShown) {
          st.firstShown = true
          this.emitSend()
        }
      }
    },
    code(val: string) {
      // Vue watch(code)：输入后清除错误态
      if (val && this.data.errorMsg) {
        this.setData({errorMsg: ''})
      }
    },
    'isView, type'() {
      this.setData({isInline: this.data.isView || this.data.type === 'inline'})
    },
    'errorMsg, disableSend'() {
      this.setData({
        isShowErrorStyle: this.data.errorMsg !== '' && !this.data.disableSend,
      })
    },
  },

  lifetimes: {
    attached() {
      this.setData({
        innerShow: this.data.show,
        isInline: this.data.isView || this.data.type === 'inline',
        countBtnText: this.data.countNormalText,
      })
      // Vue onMounted：初始即显示或内联模式 → 首次 emitSend
      const st = state(this)
      if (this.data.show || this.data.isInline) {
        st.firstShown = true
        this.emitSend()
      }
      // Vue Android resize 监听 → 小程序键盘高度监听（halfScreen halfStyle）
      if (this.data.type === 'halfScreen') {
        const handler = (res: {height: number}) => {
          this.setData({isKeyboard: res.height > 0})
        }
        st.kbHandler = handler
        wx.onKeyboardHeightChange(handler)
      }
    },
    detached() {
      const st = state(this)
      if (st.kbHandler) {
        wx.offKeyboardHeightChange(st.kbHandler)
        st.kbHandler = null
      }
      st.timers.clearAll()
    },
  },

  methods: {
    // ------------------------------------------------------------------
    // 显隐（popup / dialog 转发）
    // ------------------------------------------------------------------
    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      optimisticUpdate(this, {innerShow: e.detail.value}, 'change', {value: e.detail.value})
    },

    onPopupShow() {
      this.selectComponent('#cu-captcha-codebox')?.focus?.()
      this.triggerEvent('show')
    },

    onPopupHide() {
      this.selectComponent('#cu-captcha-codebox')?.blur?.()
      this.triggerEvent('hide')
    },

    /** Vue close：emit update:modelValue(false) */
    close() {
      optimisticUpdate(this, {innerShow: false}, 'change', {value: false})
    },

    // ------------------------------------------------------------------
    // codebox / 提交
    // ------------------------------------------------------------------
    onCodeChange(e: WechatMiniprogram.CustomEvent<{value: string}>) {
      this.setData({code: e.detail.value})
    },

    onSubmit(e: WechatMiniprogram.CustomEvent<{value: string}>) {
      this.triggerEvent('submit', {value: e.detail.value})
    },

    // ------------------------------------------------------------------
    // 发送 / 倒计时状态机（Vue onResend / emitSend / countdown / resetcount）
    // ------------------------------------------------------------------
    onResend() {
      if (this.data.autoCountdown) {
        this.countdown()
      }
      this.triggerEvent('send')
    },

    emitSend() {
      if (this.data.autoSend) {
        this.onResend()
      }
    },

    /** Vue countdown：timestamp 基准 + 1000ms interval，走 timer 登记表 */
    countdown() {
      const count = Number(this.data.count)
      if (!count) return
      const st = state(this)
      if (st.counterId != null) {
        st.timers.clearInterval(st.counterId)
        st.counterId = null
      }
      const timestamp = Date.now()
      st.countStart = timestamp
      this.setData({
        isCounting: true,
        countBtnText: this.data.countActiveText.replace('{$1}', String(count)),
      })
      st.counterId = st.timers.setInterval(() => {
        const current = Number(this.data.count)
        const tick = computeCountdown(current, st.countStart, Date.now(), this.data.countActiveText)
        if (tick.finished) {
          this.resetcount()
        } else {
          this.setData({countBtnText: tick.text})
        }
      }, 1000)
    },

    /** Vue resetcount */
    resetcount() {
      const st = state(this)
      this.setData({isCounting: false, countBtnText: this.data.countNormalText})
      if (st.counterId != null) {
        st.timers.clearInterval(st.counterId)
        st.counterId = null
      }
    },

    /** Vue setError：微任务后写入（保持时机一致） */
    setError(msg: string) {
      Promise.resolve().then(() => {
        this.setData({errorMsg: msg})
      })
    },

    noop() {},
  },
})
