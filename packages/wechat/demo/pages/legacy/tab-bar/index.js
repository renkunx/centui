/* legacy/components/tab-bar/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

Page({
  data: {
    // demo0 基础
    current0: 1,
    items0: [{name: 1, label: '标签1'}, {name: 2, label: '标签2'}],
    // demo1 首屏数量（legacy maxLength 5）
    current1: 1,
    items1: [
      {name: 1, label: '标签1'},
      {name: 2, label: '标签2'},
      {name: 3, label: '标签3'},
      {name: 4, label: '标签4'},
      {name: 5, label: '标签5'},
    ],
    // demo2 滚动
    current2: 1,
    items2: [
      {name: 1, label: '精选'},
      {name: 2, label: '全部'},
      {name: 3, label: '满减券'},
      {name: 4, label: '立减券'},
      {name: 5, label: '免息券'},
      {name: 6, label: '校园专享'},
      {name: 7, label: '夜间优惠'},
      {name: 8, label: '红包'},
    ],
    // demo3 无下划线
    current3: 1,
    items3: [{name: 1, label: '标签1'}, {name: 2, label: '标签2'}, {name: 3, label: '标签3'}],
    // demo4 自定义内容
    current4: 1,
    items4: [{name: 1, label: '首页', icon: 'home'}, {name: 2, label: '我的', icon: 'user'}],
    // demo5 监听事件
    current5: 1,
    items5: [{name: 1, label: '标签1'}, {name: 2, label: '标签2'}, {name: 3, label: '标签3'}],
    // demo6 手势切换
    current6: 0,
    items6: [{name: 0, label: '标签1'}, {name: 1, label: '标签2'}],
  },

  toastInfo(content) {
    const inst = this.selectComponent('#cu-toast')
    inst && inst.show({icon: '', content, duration: 3000})
  },

  // v-model 同步（各 demo 的 current）
  onChange0(e) {
    this.setData({current0: e.detail.value})
  },
  onChange1(e) {
    this.setData({current1: e.detail.value})
  },
  onChange2(e) {
    this.setData({current2: e.detail.value})
  },
  onChange3(e) {
    this.setData({current3: e.detail.value})
  },
  onCustomTab4(e) {
    this.setData({current4: Number(e.currentTarget.dataset.name)})
  },
  onChange5(e) {
    this.setData({current5: e.detail.value})
    // legacy onChange(item, index, prevIndex)
    const {tab, index, prevIndex} = e.detail
    this.toastInfo(`index: ${index}, prevIndex: ${prevIndex}, label: ${tab.label}`)
  },
  // demo6：tab → swiper.goto(index)
  onTabChange(e) {
    const swiper = this.selectComponent('#swiper6')
    swiper && swiper.goto(e.detail.index)
  },
  // demo6：滑动 → current = to
  onSwiperChange(e) {
    this.setData({current6: e.detail.toIndex})
  },
})
