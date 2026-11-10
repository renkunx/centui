/* legacy/components/activity-indicator/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

Page({
  data: {
    loading: false,
  },

  createPay() {
    if (this.data.loading) {
      return
    }
    this.setData({loading: true})
    setTimeout(() => {
      this.setData({loading: false})
    }, 2000)
  },
})
