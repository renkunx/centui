/* legacy/components/captcha/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

function calcCapMax(limit, maxlength) {
  return limit ? parseFloat(maxlength) : -1
}

Page({
  data: {
    // demo0：自定义
    show0: false,
    title0: '输入验证码',
    content0: '验证码已发送至 186****5407',
    limit0: true,
    maxlength0: '4',
    capMax0: calcCapMax(true, '4'),
    mask0: false,
    system0: false,
    // demo2：半屏自定义
    show2: false,
    title2: '输入短信验证码 完成验证',
    subtitle2: '用于核验信息有效性及确定本人操作',
    content2: '验证码已发送至 186****5407',
    countNormalText2: '发送验证码',
    limit2: true,
    maxlength2: '4',
    capMax2: calcCapMax(true, '4'),
    mask2: false,
    system2: true,
    useSendTimes2: 3,
    sendTimes2: 0,
    disableSend2: false,
    dialogOpen: false,
    dialogBtns: [{text: '我知道了'}],
  },

  // 页面级 Toast（legacy Toast({content}) 的等价实现，第一参为页面上下文）
  toast(props) {
    const inst = this.selectComponent('#cu-toast')
    inst && inst.show({duration: 3000, ...props})
  },

  // ---- demo0 ----
  setTitle0(e) {
    this.setData({title0: e.detail.value})
  },
  setContent0(e) {
    this.setData({content0: e.detail.value})
  },
  toggleLimit0(e) {
    const limit0 = !!e.detail.value
    this.setData({limit0, capMax0: calcCapMax(limit0, this.data.maxlength0)})
  },
  setMaxlength0(e) {
    const maxlength0 = e.detail.value
    this.setData({maxlength0, capMax0: calcCapMax(this.data.limit0, maxlength0)})
  },
  toggleMask0(e) {
    this.setData({mask0: !!e.detail.value})
  },
  toggleSystem0(e) {
    this.setData({system0: !!e.detail.value})
  },
  next0() {
    this.setData({show0: true})
  },
  onCaptchaChange0(e) {
    this.setData({show0: !!e.detail.value})
  },
  submit0(e) {
    const val = e.detail.value
    const max = parseFloat(this.data.maxlength0)
    setTimeout(() => {
      if (!this.data.limit0 || max < 0 || val.length === max) {
        if (val !== '1234') {
          const captcha = this.selectComponent('#captcha0')
          captcha && captcha.setError('验证码错误，请重新输入')
        } else {
          this.setData({show0: false})
          this.toast({content: `你输入了${val}`})
        }
      }
    }, 300)
  },
  onSend0() {
    console.log('click resend button.')
  },
  onShow0() {},
  onHide0() {},

  // ---- demo2 ----
  setTitle2(e) {
    this.setData({title2: e.detail.value})
  },
  setContent2(e) {
    this.setData({content2: e.detail.value})
  },
  setUseSendTimes2(e) {
    const n = parseFloat(e.detail.value)
    this.setData({useSendTimes2: isNaN(n) ? 0 : n})
  },
  toggleLimit2(e) {
    const limit2 = !!e.detail.value
    this.setData({limit2, capMax2: calcCapMax(limit2, this.data.maxlength2)})
  },
  setMaxlength2(e) {
    const maxlength2 = e.detail.value
    this.setData({maxlength2, capMax2: calcCapMax(this.data.limit2, maxlength2)})
  },
  toggleMask2(e) {
    this.setData({mask2: !!e.detail.value})
  },
  toggleSystem2(e) {
    this.setData({system2: !!e.detail.value})
  },
  next2() {
    this.setData({show2: true})
  },
  onCaptchaChange2(e) {
    this.setData({show2: !!e.detail.value})
  },
  submit2(e) {
    const val = e.detail.value
    const max = parseFloat(this.data.maxlength2)
    setTimeout(() => {
      if (!this.data.limit2 || max < 0 || val.length === max) {
        if (val !== '1234') {
          const captcha = this.selectComponent('#captcha2')
          captcha && captcha.setError('验证码错误，请重新输入')
        } else {
          this.setData({show2: false})
          this.toast({content: `你输入了${val}`})
        }
      }
    }, 300)
  },
  onSend2() {
    // 发送验证码（倒计时由组件 autoCountdown 自动执行，对齐 legacy cb()）
    if (this.data.sendTimes2 === 0) {
      this.setData({countNormalText2: '重新发送'})
    }
    const sendTimes2 = this.data.sendTimes2 + 1
    this.setData({sendTimes2})
    if (sendTimes2 > this.data.useSendTimes2) {
      this.setData({disableSend2: true})
      const captcha = this.selectComponent('#captcha2')
      captcha && captcha.setError('发送次数已用完，请一小时后再试')
      return
    }
    const difference = this.data.useSendTimes2 - sendTimes2
    if (sendTimes2 > 1 && difference !== 0) {
      this.toast({content: `您还可以重发${difference}次`})
    }
    console.log('click resend button.')
  },
  onShow2() {},
  onHide2() {},
  hintHandle() {
    this.setData({dialogOpen: true})
  },
})
