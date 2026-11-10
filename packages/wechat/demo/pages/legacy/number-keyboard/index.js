/* legacy/components/number-keyboard/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "isKeyBoardShow": false,
  "number": ""
},
  toggleKeyboard(index) {
      this.$set(this.isKeyBoardShow, index, !this.isKeyBoardShow[index])
    },
  keyFormatter(val) {
      if (val === '.') {
        return 'x'
      }
    },
  keyFormatter1(val) {
      console.log(val)
      if (val === '0') {
        return '.'
      }
      if (val === '00') {
        return '0'
      }
      if (val === '.') {
        return '-'
      }
    },
  onNumberEnter(val) {
      this.number += val
    },
  onNumberDelete() {
      if (this.number === '') {
        return
      }
      this.number = this.number.substr(0, this.number.length - 1)
    },
  noop() {},
})
