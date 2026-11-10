/* legacy/components/action-bar/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
const {Toast} = require('../../../../dist/components/toast/index')
const {Dialog} = require('../../../../dist/components/dialog/index')
Page({
  data: {
  "data": [
    {
      "text": "主要按钮",
      "round": true
    }
  ]
},
  handleClick() {
      Toast.succeed('Click')
    },
  onBtnClick(event, action) {
      this.$set(action, 'loading', true)
      this.$set(action, 'inactive', true)
      Dialog.alert({
        content: `${action.text}点击`,
        onConfirm: () => {
          this.$set(action, 'loading', false)
          this.$set(action, 'inactive', false)
        },
      })
    },
  noop() {},
})
