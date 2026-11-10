/* legacy/components/toast/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
const {Toast} = require('../../../../dist/components/toast/index')
Page({
  data: {
  "isShow": false
},
  showTextToast() {
      if (this.isShow) {
        this.$refs.toast.hide()
        this.isShow = false
      } else {
        this.$refs.toast.show()
        this.isShow = true
      }
    },
  showSucceedToast() {
      Toast.failed('操作失败')
    },
  showLoadingToast() {
      Toast.loading('加载中...')
      setTimeout(() => {
        Toast.hide()
      }, 3000)
    },
  start() {
      Toast.loading('载入中')
      setTimeout(() => {
        Toast.hide()
        setTimeout(() => {
          Toast.failed('载入失败')
        }, 10)
      }, 500)
    },
  showToast() {
      Toast.succeed('所有文案部分字数最多展示15个字')
    },
  noop() {},
})
