/* legacy/components/image-reader/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "imageList": {
    "reader0": [
      "//img-hxy021.didistatic.com/static/strategymis/insurancePlatform_spu/uploads/27fb7f097ca218d743f816836bc7ea4a",
      "//manhattan.didistatic.com/static/manhattan/insurancePlatform_spu/uploads/c2912793a222eb24b606a582fd849ab7"
    ],
    "reader1": []
  }
},
  onReaderSelect() {
      Toast.loading('图片读取中...')
    },
  onReaderComplete(name, {dataUrl}) {
      const demoImageList = this.imageList[name] || []

      imageProcessor({
        dataUrl,
        width: 200,
        height: 200,
        quality: 0.1,
      }).then(({dataUrl}) => {
        dataUrl && demoImageList.push(dataUrl)
      })
      this.$set(this.imageList, name, demoImageList)

      Toast.hide()
    },
  onReaderError(name, {msg}) {
      Toast.failed(msg)
    },
  onDeleteImage(name, index) {
      const demoImageList = this.imageList[name] || []
      demoImageList.splice(index, 1)
      this.$set(this.imageList, name, demoImageList)
    },
  noop() {},
})
