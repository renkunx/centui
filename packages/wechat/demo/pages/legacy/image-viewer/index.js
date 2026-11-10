/* legacy/components/image-viewer/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "isViewerShow": false,
  "viewerIndex": 0,
  "imgs": [
    "http://img-hxy021.didistatic.com/static/strategymis/insurancePlatform_spu/uploads/27fb7f097ca218d743f816836bc7ea4a",
    "http://manhattan.didistatic.com/static/manhattan/insurancePlatform_spu/uploads/c2912793a222eb24b606a582fd849ab7",
    "http://img-hxy021.didistatic.com/static/strategymis/insurancePlatform_spu/uploads/6ee5a0ba9340ca452cbc827902e76be0",
    "http://img-hxy021.didistatic.com/static/strategymis/insurancePlatform_spu/uploads/d751dd4487e265de3b8587f504eee2c3"
  ]
},
  showViewer(index) {
      this.viewerIndex = index
      this.isViewerShow = true
    },
  noop() {},
})
