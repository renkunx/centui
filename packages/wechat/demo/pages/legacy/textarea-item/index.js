/* legacy/components/textarea-item/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "value": "",
  "value2": "",
  "value3": ""
},
  format(name, curValue, curPos) {
      return {
        value: curValue.replace(/\d/g, ''),
        range: curPos,
      }
    },
  blur() {
      console.log('blur')
    },
  keyup(e) {
      console.log('keyup', e)
    },
  focus() {
      console.log('focus')
    },
  keydown(e) {
      console.log('keydown', e)
    },
  change(v) {
      console.log('change', v)
    },
  noop() {},
})
