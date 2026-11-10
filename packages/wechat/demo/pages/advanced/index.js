/* 高级组件展示宿主：命令式 API 演示与状态 */
const {Toast} = require('../../../dist/components/toast/index')
const {Tip} = require('../../../dist/components/tip/index')

function option(text, value, extra) {
  return Object.assign({text: text, value: value}, extra || {})
}

Page({
  data: {
    checkBoxValue: true,
    codeboxValue: '',
    checkListOptions: [
      option('余额宝', 'a'),
      option('零钱通', 'b', {brief: '推荐'}),
      option('银行卡', 'c', {disabled: true}),
    ],
    checkListValue: ['a'],
    radioBoxValue: false,
    radioListOptions: [
      option('按日结算', 'day'),
      option('按月结算', 'month'),
      option('按年结算', 'year'),
    ],
    radioListValue: 'day',
    selectorShow: false,
    selectorValueText: '',
    selectorData: [
      option('选项一', 'a'),
      option('选项二', 'b'),
      option('选项三', 'c', {disabled: true}),
    ],
    dropMenuData: [
      {text: '排序', options: [option('最新', 1), option('最热', 2)]},
      {text: '状态', options: [option('进行中', 3), option('已完成', 4)]},
    ],
    dropMenuValue: [],
    datePickerShow: false,
    tabPickerShow: false,
    tabPickerData: {
      name: 'root',
      label: '全部',
      value: 'all',
      children: {
        name: 'east',
        label: '华东',
        value: 'east',
        options: [option('上海', 'sh'), option('杭州', 'hz'), option('南京', 'nj')],
      },
    },
    licensePlateShow: false,
    captchaShow: false,
    cashierShow: false,
    cashierAmount: '128.00',
    cashierChannels: [
      option('支付宝', 'alipay'),
      option('微信支付', 'wechat'),
    ],
    viewerShow: false,
    viewerList: [
      {url: 'https://dummyimage.com/750x420/198cff/ffffff.png&text=A', alt: '示例图 A'},
      {url: 'https://dummyimage.com/750x420/ff6b00/ffffff.png&text=B', alt: '示例图 B'},
    ],
    landscapeShow: false,
    keyboardValue: '',
    iconList: ['success', 'check', 'close', 'arrow-right', 'warn', 'security'],
    rulerValue: 30,
    chartLabels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    chartDatasets: [
      {color: '#198cff', values: [120, 90, 150, 80, 170, 140]},
      {color: '#ff6b00', values: [60, 110, 70, 130, 90, 160]},
    ],
    wmContent: 'CentUI 演示',
    transitionShow: true,
    scrollItems: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    resultButtons: [
      {text: '刷新', type: 'primary', plain: false},
      {text: '返回', plain: true},
    ],
  },

  // ---- 表单扩展 ----
  onCheckBoxChange(e) {
    this.setData({checkBoxValue: e.detail.value})
  },
  onCodeboxChange(e) {
    this.setData({codeboxValue: e.detail.value})
  },
  onCheckListChange(e) {
    this.setData({checkListValue: e.detail.value})
  },
  onRadioBoxChange(e) {
    this.setData({radioBoxValue: e.detail.value})
  },
  onRadioListChange(e) {
    this.setData({radioListValue: e.detail.value})
  },

  // ---- selector / drop-menu ----
  showSelector() {
    this.setData({selectorShow: true})
  },
  onSelectorChange(e) {
    const value = e.detail.value
    if (typeof value === 'boolean') {
      // 显隐回流
      this.setData({selectorShow: value})
      return
    }
    // 选中：value 为选中项（或数组）
    const item = Array.isArray(value) ? value[0] : value
    this.setData({
      selectorValueText: (item && (item.text || item.label)) || String(item || ''),
      selectorShow: false,
    })
  },
  onDropMenuChange(e) {
    const bar = e.detail.barItem || {}
    const item = e.detail.listItem || {}
    Toast.info(this, `下拉：${bar.text || ''} · ${item.text || ''}`)
  },

  // ---- 弹层选择器们 ----
  showDatePicker() {
    this.setData({datePickerShow: true})
  },
  onDatePickerChange(e) {
    if (e.detail.value === false) this.setData({datePickerShow: false})
  },
  onDatePickerConfirm(e) {
    this.setData({datePickerShow: false})
    Toast.info(this, `日期：${JSON.stringify(e.detail.values)}`)
  },
  showTabPicker() {
    this.setData({tabPickerShow: true})
  },
  onTabPickerChange(e) {
    if (e.detail.value === false) this.setData({tabPickerShow: false})
  },
  onTabPickerConfirm(e) {
    this.setData({tabPickerShow: false})
    Toast.info(this, `级联：${JSON.stringify(e.detail.values || e.detail.value)}`)
  },
  showLicensePlate() {
    this.setData({licensePlateShow: true})
  },
  onLicensePlateHide() {
    this.setData({licensePlateShow: false})
  },
  onLicensePlateConfirm(e) {
    this.setData({licensePlateShow: false})
    Toast.info(this, `车牌：${e.detail.value}`)
  },
  showCaptcha() {
    this.setData({captchaShow: true})
  },
  onCaptchaChange(e) {
    if (e.detail.value === false) this.setData({captchaShow: false})
  },
  onCaptchaSend() {
    Toast.info(this, '验证码已发送')
  },
  onCaptchaSubmit(e) {
    this.setData({captchaShow: false})
    Toast.info(this, `验证码：${e.detail.value}`)
  },
  showCashier() {
    this.setData({cashierShow: true})
  },
  onCashierChange(e) {
    if (e.detail.value === false) this.setData({cashierShow: false})
  },
  onCashierPay(e) {
    this.setData({cashierShow: false})
    const item = e.detail.item || {}
    Toast.info(this, `支付：${item.text || ''} ¥${this.data.cashierAmount}`)
  },

  // ---- 键盘 ----
  onKeyboardEnter(e) {
    this.setData({keyboardValue: this.data.keyboardValue + String(e.detail.value)})
  },
  onKeyboardDelete() {
    this.setData({keyboardValue: this.data.keyboardValue.slice(0, -1)})
  },

  // ---- 展示扩展 ----
  onRulerChange(e) {
    this.setData({rulerValue: e.detail.value})
  },

  // ---- 弹层与滚动 ----
  showViewer() {
    this.setData({viewerShow: true})
  },
  onViewerChange(e) {
    this.setData({viewerShow: e.detail.value})
  },
  showLandscape() {
    this.setData({landscapeShow: true})
  },
  hideLandscape() {
    this.setData({landscapeShow: false})
  },
  onLandscapeChange(e) {
    this.setData({landscapeShow: e.detail.value})
  },
  showTip() {
    Tip(this, 'Tip 气泡演示', {position: 'top'})
    setTimeout(() => Tip.hide(this), 2000)
  },
  toggleTransition() {
    this.setData({transitionShow: !this.data.transitionShow})
  },
  onScrollEnd() {
    const next = this.data.scrollItems.length
    const items = this.data.scrollItems.concat([next + 1, next + 2])
    this.setData({scrollItems: items})
    Toast.info(this, '触底加载 2 条')
  },
  onResultButtonClick(e) {
    const button = (e.detail.button || {}).text || ''
    Toast.info(this, `结果页按钮：${button}`)
  },
})
