/* legacy/components/picker/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "pickerData": [],
  "pickerDefaultIndex": [],
  "pickerDefaultValue": [],
  "pickerValue": ""
},
  onPickerInitialed() {
      const columnValues = this.$refs.picker.getColumnValues()
      let value = ''
      columnValues.forEach(item => {
        value += `${item.label}-`
      })
      console.log(`[Mand Mobile] Picker getColumnValues: ${value.substr(0, value.length - 1)}`)
    },
  onPickerConfirm(columnIndex, itemIndex, value) {
      if (value) {
        this.pickerValue = value.text
      }
    },
  getColumnValue(picker, index) {
      const value = this.$refs.picker.getColumnValue(index)
      delete value.children
      Dialog.alert({
        content: JSON.stringify(value),
      })
    },
  getColumnIndex(picker, index) {
      const value = this.$refs.picker.getColumnIndex(index)
      Dialog.alert({
        content: `<pre>${JSON.stringify(value)}</pre>`,
      })
    },
  noop() {},
})
