/* legacy/components/date-picker/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "minDate": "2013-09-08T16:00:00.000Z",
  "maxDate": "2020-09-08T16:00:00.000Z",
  "currentDate": "2026-11-10T18:03:57.926Z",
  "isDatePickerShow": false,
  "datePickerValue": ""
},
  onDatePickerInitialed() {
      console.log(`[Mand Mobile] DatePicker getFormatDate: ${this.$refs.datePicker.getFormatDate('yyyy/MM/dd')}`)
    },
  textRender() {
      const args = Array.prototype.slice.call(arguments)
      const typeFormat = args[0] // 类型
      // const column0Value = args[1] // 第1列选中值
      // const column1Value = args[2] // 第2列选中值
      const column2Value = args[3] // 第3列选中值
      if (typeFormat === 'dd') {
        return `*${column2Value}日`
      }
    },
  onDatePickerChange(columnIndex, itemIndex, value) {
      console.log(
        `[Mand Mobile] DatePicker Change\ncolumnIndex: ${columnIndex},\nitemIndex:${itemIndex},\nvalue: ${JSON.stringify(
          value,
        )}`,
      )
    },
  onDatePickerConfirm(columnsValue) {
      console.log(`[Mand Mobile] DatePicker Confirm\nvalue: ${JSON.stringify(columnsValue)}`)
      this.datePickerValue = this.$refs.datePicker.getFormatDate('yyyy/MM/dd hh:mm')
    },
  noop() {},
})
