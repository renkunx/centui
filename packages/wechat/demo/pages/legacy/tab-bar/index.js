/* legacy/components/tab-bar/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "current": 0,
  "items": [
    {
      "name": 0,
      "label": "标签1"
    },
    {
      "name": 1,
      "label": "标签2"
    }
  ]
},
  onChange(item, index, prevIndex) {
      Toast.info(`index: ${index}, prevIndex: ${prevIndex}, label: ${item.label}`)
    },
  onSwiperChange(from, to) {
      this.current = to
    },
  onTabChange(item, index) {
      this.$refs.swiper.goto(index)
    },
  noop() {},
})
