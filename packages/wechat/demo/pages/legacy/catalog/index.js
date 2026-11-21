/* legacy 展示总目录：分组与 mand-mobile v2 文档一致（components.json） */
const groups = [{"category": "basic", "text": "基础", "items": [{"dir": "action-bar", "text": "操作栏"}, {"dir": "activity-indicator", "text": "活动指示器"}, {"dir": "button", "text": "按钮"}, {"dir": "cell-item", "text": "列表单元"}, {"dir": "detail-item", "text": "清单项"}, {"dir": "drop-menu", "text": "下拉菜单"}, {"dir": "icon", "text": "图标"}, {"dir": "image-reader", "text": "图片选择器"}, {"dir": "image-viewer", "text": "图片浏览器"}, {"dir": "notice-bar", "text": "通知栏"}, {"dir": "progress", "text": "进度"}, {"dir": "skeleton", "text": "骨架屏"}, {"dir": "stepper", "text": "步进器"}, {"dir": "steps", "text": "步骤条"}, {"dir": "swiper", "text": "轮播"}, {"dir": "tab-bar", "text": "标签栏"}, {"dir": "tabs", "text": "标签页"}, {"dir": "tag", "text": "标签"}]}, {"category": "business", "text": "业务相关", "items": [{"dir": "amount", "text": "金融数字"}, {"dir": "bill", "text": "票据"}, {"dir": "captcha", "text": "验证码窗口"}, {"dir": "cashier", "text": "收银台"}, {"dir": "chart", "text": "折线图表"}, {"dir": "landscape", "text": "压屏窗"}, {"dir": "result-page", "text": "结果页"}, {"dir": "ruler", "text": "刻度尺"}, {"dir": "water-mark", "text": "水印"}, {"dir": "license-plate", "text": "车牌号"}]}, {"category": "feedback", "text": "操作反馈", "items": [{"dir": "action-sheet", "text": "动作面板"}, {"dir": "date-picker", "text": "日期选择器"}, {"dir": "dialog", "text": "模态窗"}, {"dir": "picker", "text": "选择器"}, {"dir": "popup", "text": "弹出层"}, {"dir": "selector", "text": "列表选择器"}, {"dir": "tab-picker", "text": "多频道选择器"}, {"dir": "tip", "text": "气泡提示"}, {"dir": "toast", "text": "轻提示"}, {"dir": "transition", "text": "动画"}]}, {"category": "form", "text": "表单相关", "items": [{"dir": "agree", "text": "勾选按钮"}, {"dir": "check", "text": "选择项组"}, {"dir": "codebox", "text": "字符码输入框"}, {"dir": "field", "text": "区域列表组合"}, {"dir": "input-item", "text": "输入框"}, {"dir": "number-keyboard", "text": "数字键盘"}, {"dir": "radio", "text": "单选框"}, {"dir": "slider", "text": "滑块"}, {"dir": "switch", "text": "开关"}, {"dir": "textarea-item", "text": "文本域"}]}, {"category": "gesture", "text": "手势", "items": [{"dir": "scroll-view", "text": "滚动区域/下拉刷新"}]}]

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
