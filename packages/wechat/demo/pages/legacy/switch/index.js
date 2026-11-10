/* legacy/components/switch/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "isActive": false
},
  handler(name, active) {
      console.log(`Status of switch ${name} is ${active ? 'active' : 'inactive'}`)
    },
  noop() {},
})
