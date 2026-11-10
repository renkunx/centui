/* 展示宿主 JS：命令式 API 演示与表单状态 */
const {Toast} = require('../../../dist/components/toast/index')
const {Dialog} = require('../../../dist/components/dialog/index')
const {ActionSheet} = require('../../../dist/components/action-sheet/index')

Page({
  data: {
    amount: 12345.6789,
    stepperValue: 3,
    switchValue: true,
    checkValue: ['a'],
    radioValue: 'b',
    agreeValue: true,
    inputValue: '',
    sliderValue: 30,
    stepsList: [
      {name: '1', text: '提交订单'},
      {name: '2', text: '付款成功'},
      {name: '3', text: '交易完成'},
    ],
    barActions: [
      {text: '客服', plain: true},
      {text: '立即付款', type: 'primary'},
    ],
    popupShow: false,
    pickerShow: false,
    pickerValue: [1],
    pickerColumns: [
      [
        {text: '选项 A', value: 0},
        {text: '选项 B', value: 1},
        {text: '选项 C', value: 2},
        {text: '选项 D', value: 3},
      ],
    ],
    tabsValue: '0',
    tabs: [{value: '0', label: '持仓'}, {value: '1', label: '委托'}, {value: '2', label: '成交'}],
    swiperCurrent: 0,
    swiperImages: [
      'https://dummyimage.com/750x300/198cff/ffffff.png&text=1',
      'https://dummyimage.com/750x300/ff6b00/ffffff.png&text=2',
      'https://dummyimage.com/750x300/21ba66/ffffff.png&text=3',
    ],
  },

  showToast() {
    Toast.info(this, '已保存')
  },
  showToastLoading() {
    Toast.loading(this, '加载中…')
    setTimeout(() => Toast.clear(this), 1500)
  },
  showDialog() {
    Dialog.confirm(this, {
      title: '删除记录',
      content: '删除后不可恢复，确认删除这条交易记录？',
    })
      .then(() => Toast.info(this, '已删除'))
      .catch(() => {})
  },
  showSucceed() {
    Dialog.succeed(this, {title: '提交成功', content: '订单已提交，等待对方确认。'}).catch(() => {})
  },
  showActionSheet() {
    ActionSheet.create(this, {
      title: '选择操作',
      options: [{text: '买入'}, {text: '卖出'}, {text: '撤单', disabled: true}],
    })
      .then((res) => Toast.info(this, `选中：${res.text}`))
      .catch(() => {})
  },
  showPicker() {
    this.setData({pickerShow: true})
  },
  showPopup() {
    this.setData({popupShow: true})
  },
  closePopup() {
    this.setData({popupShow: false})
  },
  onPopupChange(e) {
    this.setData({popupShow: e.detail.value})
  },
  onBarClick(e) {
    const action = e.detail.action || {}
    Toast.info(this, `点击：${action.text || ''}`)
  },

  onStepperChange(e) {
    this.setData({stepperValue: e.detail.value})
  },
  onSwitchChange(e) {
    this.setData({switchValue: e.detail.value})
  },
  onCheckChange(e) {
    this.setData({checkValue: e.detail.value})
  },
  onRadioChange(e) {
    this.setData({radioValue: e.detail.value})
  },
  onAgreeChange(e) {
    this.setData({agreeValue: e.detail.value})
  },
  onInputChange(e) {
    this.setData({inputValue: e.detail.value})
  },
  onSliderChange(e) {
    this.setData({sliderValue: e.detail.value})
  },
  onTabsChange(e) {
    this.setData({tabsValue: e.detail.value})
  },
  onPickerConfirm(e) {
    this.setData({pickerShow: false})
    Toast.info(this, `选中索引 ${JSON.stringify(e.detail.value)}`)
  },
  onPickerCancel() {
    this.setData({pickerShow: false})
  },
  onSwiperChange(e) {
    this.setData({swiperCurrent: e.detail.current ?? e.detail.value})
  },
})
