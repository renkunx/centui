/* legacy/components/activity-indicator/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "loading": false
},
  createPay() {
      if (this.loading) {
        return
      }
      this.loading = true
      setTimeout(() => {
        this.loading = false
      }, 2000)
    },
  noop() {},
})
