/* legacy/components/cell-item/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
const {Dialog} = require('../../../../dist/components/dialog/index')
Page({
  data: {
  "open": false
},
  onClick() {
      Dialog.alert({
        content: '点击了',
      })
    },
  noop() {},
})
