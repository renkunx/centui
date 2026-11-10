/* legacy/components/input-item/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
const {Dialog} = require('../../../../dist/components/dialog/index')
const {Toast} = require('../../../../dist/components/toast/index')

Page({
  data: {
  "phone": "13321234431",
  "money": "",
  "digit": "",
  "value": "",
  "bankCardNo": "",
  "isError": false
},
  onInputKeydown(name, event) {
      console.log(`[Mand Mobile InputItem keydown] ${event.keyCode}`)
    },
  onInputChange(name, value) {
      console.log(`[Mand Mobile InputItem change] ${value}`)
    },
  takeAll() {
      this.value = '300000'
    },
  onClick() {
      Toast({
        content: 'some information',
        icon: 'warn',
      })
    },
  onFakeInputFocus() {
      // function getElementPosition(element) {
      //   const defaultRect = {top: 0, left: 0}
      //   const rect = element
      //     ? (element.getBoundingClientRect && element.getBoundingClientRect()) || defaultRect
      //     : defaultRect
      //   const ret = {
      //     top: rect.top,
      //     left: rect.left,
      //   }
      //   return ret
      // }
      // setTimeout(() => {
      //   const wrapper = this.$el
      //   const inputer = this.$refs['input10']
      //   const inputEl = inputer.$el
      //   const keyboardEl = document
      //     .querySelector(`#${inputer.name}-number-keyboard`)
      //     .querySelector('.md-number-keyboard-container')
      //   const offset =
      //     keyboardEl.clientHeight +
      //     inputEl.clientHeight -
      //     document.documentElement.clientHeight +
      //     getElementPosition(inputEl).top +
      //     30
      //   const oldPaddingBottom = +wrapper.style.paddingBottom.replace(/px|rem|em/gi, '')
      //   const oldScrollTop = document.body.scrollTop
      //   const newPaddingBottom = oldPaddingBottom + offset
      //   const newScrollTop = oldScrollTop + offset
      //   wrapper.style.paddingBottom = `${newPaddingBottom}px`
      //   document.body.scrollTop = newScrollTop
      //   this.scrollInputBack = () => {
      //     wrapper.style.paddingBottom = `${oldPaddingBottom}px`
      //     document.body.scrollTop = oldScrollTop
      //     this.scrollInputBack = null
      //   }
      // }, 300)
    },
  onFakeInputBlur() {
      this.scrollInputBack && this.scrollInputBack()
    },
  checkBankCard() {
      if (this.bankCardNo && this.bankCardNo.substr(0, 4) !== '6222') {
        this.isError = true
      } else {
        this.isError = false
      }
    },
  bankCardTip() {
      Dialog.alert({
        content: '以6222开头',
      })
    },
  noop() {},
})
