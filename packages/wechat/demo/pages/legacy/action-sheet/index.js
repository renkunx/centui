/* legacy/components/action-sheet/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "value": false,
  "options": [
    {
      "label": "选项1",
      "value": 0
    },
    {
      "label": "选项2",
      "value": 1
    },
    {
      "label": "选项3",
      "value": 2
    }
  ],
  "defaultIndex": 1,
  "invalidIndex": 2,
  "cancelText": "取消"
},
  $_showActionSheet() {
      ActionSheet.create({
        value: true,

        options: [
          {
            label: '选项1',
            value: 0,
          },
          {
            label: '选项2',
            value: 1,
          },
          {
            label: '选项3',
            value: 2,
          },
        ],
        defaultIndex: 1,
        invalidIndex: 2,
        cancelText: '取消',
        onCancel: this.$_cancel,
        onSelected: this.$_selected,
      })
    },
  $_selected(item) {
      Dialog.alert({
        content: `selected: ${JSON.stringify(item)}`,
      })
      console.log('action-sheet selected:', JSON.stringify(item))
    },
  $_cancel() {
      Dialog.alert({
        content: 'cancel',
      })
      console.log('action-sheet cancel')
    },
  noop() {},
})
