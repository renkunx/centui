/* legacy 展示总目录：分组与 mand-mobile v2 文档一致（components.json） */
const groups = require('./data.json')

// legacy 没有而 wechat 版新增的组件归入补充分组
const extra = {
  category: 'extra',
  text: 'v3 新增',
  items: [
    {dir: 'check-base', text: '勾选基座'},
    {dir: 'check-box', text: '方形勾选'},
    {dir: 'check-list', text: '列表勾选'},
    {dir: 'radio-box', text: '方形单选'},
    {dir: 'popup-title-bar', text: '弹层标题栏'},
    {dir: 'steps', text: '步骤条'},
    {dir: 'swiper', text: '轮播'},
    {dir: 'swiper-item', text: '轮播单元'},
    {dir: 'tab-pane', text: '标签页单元'},
    {dir: 'tabs', text: '标签页'},
    {dir: 'transition', text: '过渡'},
  ].filter((i) => !groups.some((g) => g.items.some((j) => j.dir === i.dir))),
}

Page({
  data: {
    groups: [...groups, ...(extra.items.length ? [extra] : [])],
  },

  goDemo(e) {
    const dir = e.currentTarget.dataset.dir
    wx.navigateTo({url: `/demo/pages/legacy/${dir}/index`})
  },
})
