/* legacy/components/tip/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
const {Toast} = require('../../../../dist/components/toast/index')
Page({
  data: {
  "tipOffset": {top: -10},},
  onShow(name) {
      Toast({
        content: `显示了${name}`,
      })
    },
  onHide(name) {
      Toast({
        content: `隐藏了${name}`,
      })
    },
  noop() {},
})
