/* legacy/components/radio/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "checked": "0",
  "marriage": "2",
  "myBank": "",
  "banks": [
    {
      "value": "0",
      "text": "交通银行(尾号3089)",
      "brief": "选项摘要描述"
    },
    {
      "value": "1",
      "text": "招商银行(尾号2342)",
      "brief": "选项摘要描述"
    },
    {
      "value": "2",
      "text": "建设银行(尾号4321)",
      "brief": "选项摘要描述",
      "disabled": true
    }
  ],
  "myReason": "",
  "reasons": [
    {
      "value": "0",
      "text": "我有其他保险"
    },
    {
      "value": "1",
      "text": "每单都扣，我担心扣太多"
    },
    {
      "value": "2",
      "text": "我身体好，不需要重疾险"
    },
    {
      "value": "3",
      "text": "接单少，加入这个没什么用"
    },
    {
      "value": "4",
      "text": "我不了解这是什么计划"
    }
  ],
  "favorites": "apple",
  "pay": "month",
  "insurants": "self"
},
  noop() {},
})
