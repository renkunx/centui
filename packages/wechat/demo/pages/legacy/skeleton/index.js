/* legacy/components/skeleton/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "loading": true
},
  startLoading() {
      this.loading = true
      setTimeout(() => {
        this.loading = false
      }, 3000)
    },
  noop() {},
})
