/* legacy/components/license-plate/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "defaultValue": "",
  "showPopUp": false,
  "licensePlate": ""
},
  hide() {
      this.showPopUp = false
    },
  changeNumber() {
      this.showPopUp = true
    },
  confirm(value) {
      this.hide()
      this.licensePlate = value
    },
  noop() {},
})
