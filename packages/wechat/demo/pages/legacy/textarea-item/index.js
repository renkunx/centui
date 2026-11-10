/* legacy/components/textarea-item/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

Page({
  data: {
    value0: '',
    value2: '',
    value3: '',
    valueErr: '',
    valueD2: '',
  },

  onReady() {
    // legacy :formation="format"：函数属性改为 setFormation 注入
    const textarea = this.selectComponent('#textarea3')
    if (textarea) {
      textarea.setFormation((name, curValue, curPos) => ({
        value: curValue.replace(/\d/g, ''),
        range: curPos,
      }))
    }
  },

  onValue0Change(e) {
    this.setData({value0: e.detail.value})
  },
  onValue2Change(e) {
    this.setData({value2: e.detail.value})
  },
  onValue3Change(e) {
    this.setData({value3: e.detail.value})
  },
  onValueD2Change(e) {
    this.setData({valueD2: e.detail.value})
  },
  change(e) {
    // v-model 回写 + legacy console.log('change', v)
    this.setData({valueErr: e.detail.value})
    console.log('change', e.detail.value)
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
})
