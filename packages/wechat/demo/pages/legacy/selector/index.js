/* legacy/components/selector/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

Page({
  data: {
    // demo0 无需确认
    isSelectorShow0: false,
    data0: [
      [
        {value: '1', text: '选项一'},
        {value: '2', text: '选项二'},
        {value: '3', text: '选项三'},
        {value: '4', text: '选项四'},
        {value: '5', text: '选项五'},
        {value: '6', text: '选项六'},
        {value: '7', text: '选项七'},
        {value: '8', text: '选项八'},
        {value: '9', text: '选项九'},
        {value: '10', text: '选项十'},
      ],
    ],
    selectorValue0: '选项二',
    // demo1 自定义选项（brief = describe-序号，对齐 slot-scope 展示）
    isSelectorShow1: false,
    data1: [
      [
        {value: 'A', text: '选项一', describe: '使用slot-scope', brief: '使用slot-scope-0'},
        {value: 'B', text: '选项二', describe: '使用slot-scope', brief: '使用slot-scope-1'},
        {value: 'C', text: '选项三', describe: '使用slot-scope', disabled: true, brief: '使用slot-scope-2'},
        {value: 'D', text: '选项四', describe: '使用slot-scope', brief: '使用slot-scope-3'},
      ],
    ],
    selectorValue1: '',
    // demo2 确认模式
    isSelectorShow2: false,
    data2: [
      [
        {value: '1', text: '选项一', brief: '选项一说明'},
        {value: '2', text: '选项二', brief: '选项二说明'},
        {value: '3', text: '选项三', brief: '选项三说明'},
        {value: '4', text: '选项四', brief: '选项四说明'},
      ],
    ],
    selectorValue2: '',
    // demo3 Check模式
    isSelectorShow3: false,
    data3: [
      [
        {value: '1', text: '选项一'},
        {value: '2', text: '选项二'},
        {value: '3', text: '选项三', disabled: true},
        {value: '4', text: '选项四'},
      ],
    ],
    selectorValue3: '',
    // demo4 多选模式
    isSelectorShow4: false,
    data4: [
      [
        {value: '1', text: '选项一'},
        {value: '2', text: '选项二'},
        {value: '3', text: '选项三'},
        {value: '4', text: '选项四'},
      ],
    ],
    selectorValue4: ['1'],
    selectorValue4Str: '1', // legacy {{selectorValue.join(',')}}
  },

  // ---- demo0 ----
  showSelector0() {
    this.setData({isSelectorShow0: true})
  },
  onSelectorShowChange0(e) {
    if (typeof e.detail.value === 'boolean') {
      this.setData({isSelectorShow0: e.detail.value})
    }
  },
  onSelectorChoose0(e) {
    this.setData({selectorValue0: e.detail.item.text})
  },

  // ---- demo1 ----
  showSelector1() {
    this.setData({isSelectorShow1: true})
  },
  onSelectorShowChange1(e) {
    if (typeof e.detail.value === 'boolean') {
      this.setData({isSelectorShow1: e.detail.value})
    }
  },
  onSelectorChoose1(e) {
    this.setData({selectorValue1: e.detail.item.text})
  },

  // ---- demo2 ----
  showSelector2() {
    this.setData({isSelectorShow2: true})
  },
  onSelectorShowChange2(e) {
    if (typeof e.detail.value === 'boolean') {
      this.setData({isSelectorShow2: e.detail.value})
    }
  },
  onSelectorConfirm2(e) {
    this.setData({selectorValue2: e.detail.item.text})
  },

  // ---- demo3 ----
  showSelector3() {
    this.setData({isSelectorShow3: true})
  },
  onSelectorShowChange3(e) {
    if (typeof e.detail.value === 'boolean') {
      this.setData({isSelectorShow3: e.detail.value})
    }
  },
  onSelectorConfirm3(e) {
    this.setData({selectorValue3: e.detail.item.text})
  },

  // ---- demo4 ----
  showSelector4() {
    this.setData({isSelectorShow4: true})
  },
  onSelectorShowChange4(e) {
    if (typeof e.detail.value === 'boolean') {
      this.setData({isSelectorShow4: e.detail.value})
    }
  },
  onSelectorConfirm4(e) {
    // legacy onSelectorConfirm(array) → selectorValue = array
    const array = e.detail.value || []
    this.setData({selectorValue4: array, selectorValue4Str: array.join(',')})
  },
})
