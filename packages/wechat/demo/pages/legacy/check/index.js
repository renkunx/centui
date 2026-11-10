/* legacy/components/check/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "checked": false,
  "favorites": [
    "apple"
  ],
  "pay": "",
  "insurants": [
    "self",
    "couple"
  ],
  "fruits": [
    {
      "value": "watermelon",
      "label": "西瓜",
      "brief": "选项摘要描述"
    },
    {
      "value": "apple",
      "label": "苹果",
      "brief": "选项摘要描述"
    },
    {
      "value": "banana",
      "label": "香蕉",
      "brief": "选项摘要描述"
    },
    {
      "value": "orange",
      "label": "橙子",
      "brief": "选项摘要描述"
    },
    {
      "value": "tomato",
      "label": "西红柿",
      "brief": "选项摘要描述",
      "disabled": true
    }
  ]
},
  checkAll() {
      this.$refs.checkList.$refs.group.toggleAll(true)
    },
  toggleAll() {
      this.$refs.checkList.$refs.group.toggleAll()
    },
  noop() {},
})
