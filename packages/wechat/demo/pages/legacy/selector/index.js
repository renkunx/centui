/* legacy/components/selector/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "isSelectorShow": false,
  "data": [
    [
      {
        "value": "1",
        "text": "选项一"
      },
      {
        "value": "2",
        "text": "选项二"
      },
      {
        "value": "3",
        "text": "选项三"
      },
      {
        "value": "4",
        "text": "选项四"
      }
    ]
  ],
  "selectorValue": [
    "1"
  ]
},
  showSelector() {
      this.isSelectorShow = true
    },
  onSelectorChoose({text}) {
      this.selectorValue = text
    },
  onSelectorConfirm(array) {
      this.selectorValue = array
    },
  noop() {},
})
