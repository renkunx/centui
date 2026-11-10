/* legacy/components/swiper/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

// legacy/components/swiper/demo/data/simple
const simple = [
  {color: '#4390EE', text: '给时光以生命，给岁月以文明。'},
  {color: '#364d79', text: '你的无畏来源于无知。'},
  {color: '#CA4040', text: '一切都将逝去，只有死神永生。'},
]

// legacy/components/swiper/demo/data/mulit-item
const mulit = [
  [
    {color: '#4390EE', text: '引力波'},
    {color: '#CA4040', text: '智子'},
    {color: '#FF8604', text: '水滴'},
    {color: '#00CC00', text: '二向箔'},
    {color: '#0066CC', text: '飞刃'},
    {color: '#99CCCC', text: '碎星'},
  ],
  [
    {color: '#990033', text: '危机'},
    {color: '#CCFF66', text: '威摄'},
    {color: '#FF9900', text: '威摄后'},
    {color: '#FF9933', text: '广播'},
    {color: '#99CC33', text: '掩体'},
    {color: '#CC6699', text: '银河'},
  ],
  [
    {color: '#0099CC', text: '猜疑链'},
    {color: '#CCCCCC', text: '技术爆炸'},
    {color: '#FF6666', text: '黑暗森林'},
    {color: '#99CCCC', text: '地球'},
    {color: '#FFCC99', text: '三体'},
    {color: '#FFCCCC', text: '歌者'},
  ],
]

// wx:key 用的稳定键（小程序 wx:key 不能用 $index 表达式）
const simpleKeyed = simple.map((item, key) => ({...item, key}))
// demo0 异步加载：simple.concat(simple)，键取追加后的位置序号
const simpleDoubled = simpleKeyed.concat(simpleKeyed.map((item, i) => ({...item, key: simpleKeyed.length + i})))
const mulitKeyed = mulit.map((group, key) => ({key, subs: group.map((sub, i) => ({...sub, key: i}))}))

Page({
  data: {
    simple: simpleKeyed,
    mulit: mulitKeyed,
    // 各 case 的 message 行展示字段（原为 document.querySelector 写 valueSwiperN span）
    m0: {bf: 0, bt: 0, af: 0, at: 0},
    m1: {bf: 0, bt: 0, af: 0, at: 0},
    m2: {bf: 0, bt: 0, af: 0, at: 0},
    m3: {bf: 0, bt: 0, af: 0, at: 0},
  },

  onLoad() {
    // demo0 mounted：10 秒后异步加载更多项，24.5 秒后重置为初始数量
    this._loadTimer = setTimeout(() => {
      this.setData({simple: simpleDoubled})
    }, 10000)
    this._resetTimer = setTimeout(() => {
      this.setData({simple: simpleKeyed})
    }, 24500)
  },

  onUnload() {
    clearTimeout(this._loadTimer)
    clearTimeout(this._resetTimer)
  },

  beforeChange0(e) {
    this.setData({'m0.bf': e.detail.fromIndex, 'm0.bt': e.detail.toIndex})
  },
  afterChange0(e) {
    this.setData({'m0.af': e.detail.fromIndex, 'm0.at': e.detail.toIndex})
  },
  beforeChange1(e) {
    this.setData({'m1.bf': e.detail.fromIndex, 'm1.bt': e.detail.toIndex})
  },
  afterChange1(e) {
    this.setData({'m1.af': e.detail.fromIndex, 'm1.at': e.detail.toIndex})
  },
  beforeChange2(e) {
    this.setData({'m2.bf': e.detail.fromIndex, 'm2.bt': e.detail.toIndex})
  },
  afterChange2(e) {
    this.setData({'m2.af': e.detail.fromIndex, 'm2.at': e.detail.toIndex})
  },
  beforeChange3(e) {
    this.setData({'m3.bf': e.detail.fromIndex, 'm3.bt': e.detail.toIndex})
  },
  afterChange3(e) {
    this.setData({'m3.af': e.detail.fromIndex, 'm3.at': e.detail.toIndex})
  },

  // 原 window.triggerSwiperN / this.$refs.swiper.goto(2)
  goto0() {
    const swiper = this.selectComponent('#swiper0')
    swiper && swiper.goto(2)
  },
  play0() {
    const swiper = this.selectComponent('#swiper0')
    swiper && swiper.play()
  },
  stop0() {
    const swiper = this.selectComponent('#swiper0')
    swiper && swiper.stop()
  },
  goto2() {
    const swiper = this.selectComponent('#swiper2')
    swiper && swiper.goto(2)
  },
  goto3() {
    const swiper = this.selectComponent('#swiper3')
    swiper && swiper.goto(2)
  },
})
