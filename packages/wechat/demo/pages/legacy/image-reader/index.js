/* legacy/components/image-reader/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

Page({
  data: {
    imageList: {
      reader0: [
        '//img-hxy021.didistatic.com/static/strategymis/insurancePlatform_spu/uploads/27fb7f097ca218d743f816836bc7ea4a',
        '//manhattan.didistatic.com/static/manhattan/insurancePlatform_spu/uploads/c2912793a222eb24b606a582fd849ab7',
      ],
      reader1: [],
    },
  },

  // Toast.loading/hide/failed → 页面 cu-toast 命令式调用
  toastLoading(content) {
    const inst = this.selectComponent('#cu-toast')
    inst && inst.show({icon: 'spinner', content, duration: 0, hasMask: true})
  },
  toastHide() {
    const inst = this.selectComponent('#cu-toast')
    inst && inst.hide()
  },
  toastFailed(content) {
    const inst = this.selectComponent('#cu-toast')
    inst && inst.show({icon: 'fail', content, duration: 3000})
  },

  // 事件载荷 {name, files} / {name, file, url, base64, dataUrl} / {name, msg}（name 并入载荷）
  onReaderSelect(e) {
    const {name, files} = e.detail
    ;(files || []).forEach((file) => {
      console.log('[Mand Mobile] ImageReader Selected:', 'File Name ' + (file.name || file.tempFilePath))
    })
    this.toastLoading('图片读取中...')
  },
  onReaderComplete(e) {
    const {name, dataUrl} = e.detail
    this.toastHide()
    console.log('[Mand Mobile] ImageReader Complete:', name)
    // demo0：setTimeout 100ms 后入列；demo1：经 imageProcessor 压缩后入列
    //（canvas 处理器无小程序移植，dataUrl 直接入列，时序对齐 100ms）
    setTimeout(() => {
      const list = this.data.imageList[name] || []
      if (dataUrl) {
        list.push(dataUrl)
      }
      this.setData({[`imageList.${name}`]: list})
    }, 100)
  },
  onReaderError(e) {
    const {msg} = e.detail
    this.toastFailed(msg)
  },
  onDeleteImage0(e) {
    this.doDeleteImage('reader0', Number(e.currentTarget.dataset.index))
  },
  onDeleteImage1(e) {
    this.doDeleteImage('reader1', Number(e.currentTarget.dataset.index))
  },
  doDeleteImage(name, index) {
    const list = this.data.imageList[name] || []
    list.splice(index, 1)
    this.setData({[`imageList.${name}`]: list})
  },
})
