/* legacy/components/captcha/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "show": false,
  "appendTo": {},
  "content": "验证码已发送至 186****5407",
  "limit": true,
  "maxlength": "4",
  "mask": false,
  "system": true,
  "subtitle": "用于核验信息有效性及确定本人操作",
  "countNormalText": "发送验证码",
  "useSendTimes": 3,
  "sendTimes": 0,
  "disableSend": false,
  "dialogConfig": {
    "open": false,
    "btns": [
      {
        "text": "我知道了"
      }
    ]
  }
},
  next() {
      this.show = true
    },
  submit(val) {
      const max = parseFloat(this.maxlength)
      setTimeout(() => {
        if (!this.limit || max < 0 || val.length === max) {
          if (val !== '1234') {
            this.$refs.captcha.setError('验证码错误，请重新输入')
          } else {
            this.show = false
            Toast({
              content: `你输入了${val}`,
            })
          }
        }
      }, 300)
    },
  onSend(cb) {
      // -------- 发送验证码成功 -------
      // 修改按钮文字
      if (this.sendTimes === 0) {
        this.countNormalText = '重新发送'
      }
      this.sendTimes += 1
      if (this.sendTimes > this.useSendTimes) {
        this.disableSend = true
        this.$refs.captcha.setError('发送次数已用完，请一小时后再试')
        return
      }
      const difference = this.useSendTimes - this.sendTimes
      if (this.sendTimes > 1 && difference !== 0) {
        Toast({
          content: `您还可以重发${difference}次`,
        })
      }
      // 倒计时开始
      cb()
      console.log('click resend button.')
    },
  onShow() {},
  onHide() {
      // this.show = false;
    },
  hintHandle() {
      this.dialogConfig.open = true
    },
  onConfirm() {
      this.dialogConfig.open = false
    },
  noop() {},
})
