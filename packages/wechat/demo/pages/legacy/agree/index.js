/* legacy/components/agree/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "agreeConf": {
    "checked": false,
    "size": "md",
    "disabled": false,
    "introduction": "方形勾选框未选中状态"
  }
},
  onChange(name, checked) {
      console.log(`agree name = ${name} is ${checked ? 'checked' : 'unchecked'}`)
    },
  noop() {},
})
