/* legacy/components/cashier/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "isCashierhow": false,
  "isCashierCaptcha": false,
  "cashierAmount": "100.00",
  "cashierResult": "success",
  "cashierResults": [
    {
      "text": "支付成功",
      "value": "success"
    },
    {
      "text": "支付失败",
      "value": "fail"
    }
  ],
  "cashierChannels": [
    {
      "img": "https://pt-starimg.didistatic.com/static/starimg/img/rZBbFoIJEJ1546934427562.png",
      "text": "XX银行(1234)",
      "desc": "当前银行维护中",
      "value": "001",
      "disabled": true,
      "action": {
        "text": "更换"
      }
    }
  ],
  "isCashierInitialed": false
},
  doPay() {
      if (this.isCashierCaptcha) {
        this.cashier.next('captcha', {
          text: 'Verification code sent to 156 **** 8965',
          autoCountdown: false,
          countNormalText: 'Send Verification code',
          countActiveText: 'Retransmission after {$1}s',
          onSend: countdown => {
            console.log('[Mand Mobile] Send Captcha')
            this.sendCaptcha().then(() => {
              countdown()
            })
          },
          onSubmit: code => {
            console.log(`[Mand Mobile] Send Submit ${code}`)
            this.checkCaptcha(code).then(res => {
              if (res) {
                this.createPay().then(() => {
                  this.cashier.next(this.cashierResult)
                })
              }
            })
          },
        })
      } else {
        this.createPay().then(() => {
          this.cashier.next(this.cashierResult, {
            actions: [
              {
                buttonText: '返回',
                handler: () => {
                  this.cashier.next('choose')
                },
              },
              {
                buttonText: '重试',
                handler: () => {
                  this.cashier.next('custom')
                },
              },
            ],
          })
        })
      }
    },
  createPay() {
      this.cashier.next('loading')
      return new Promise(resolve => {
        this.timer = setTimeout(() => {
          resolve()
        }, 3000)
      })
    },
  sendCaptcha() {
      return new Promise(resolve => {
        this.timer = setTimeout(() => {
          resolve()
        }, 200)
      })
    },
  checkCaptcha(code) {
      return new Promise(resolve => {
        this.timer = setTimeout(() => {
          resolve(!!code)
        }, 200)
      })
    },
  onCashierSelect(item) {
      console.log(`[Mand Mobile] Select ${JSON.stringify(item)}`)
    },
  onCashierPay(item) {
      console.log(`[Mand Mobile] Pay ${JSON.stringify(item)}`)
      this.doPay()
    },
  onCashierCancel() {
      // Abort pay request or checking request
      this.timer && clearTimeout(this.timer)
    },
  onCashierShow() {
      setTimeout(() => {
        this.isCashierInitialed = true
      }, 2000)
    },
  noop() {},
})
