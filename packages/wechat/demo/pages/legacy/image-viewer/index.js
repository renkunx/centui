/* legacy/components/image-viewer/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

Page({
  data: {
    isViewerShow: false,
    viewerIndex: 0,
    imgs: [
      'http://img-hxy021.didistatic.com/static/strategymis/insurancePlatform_spu/uploads/27fb7f097ca218d743f816836bc7ea4a',
      'http://manhattan.didistatic.com/static/manhattan/insurancePlatform_spu/uploads/c2912793a222eb24b606a582fd849ab7',
      'http://img-hxy021.didistatic.com/static/strategymis/insurancePlatform_spu/uploads/6ee5a0ba9340ca452cbc827902e76be0',
      'http://img-hxy021.didistatic.com/static/strategymis/insurancePlatform_spu/uploads/d751dd4487e265de3b8587f504eee2c3',
    ],
  },

  showViewer(e) {
    this.setData({
      viewerIndex: Number(e.currentTarget.dataset.index),
      isViewerShow: true,
    })
  },
  // v-model 回写（关闭时 change {value: false}）
  onViewerChange(e) {
    if (typeof e.detail.value === 'boolean') {
      this.setData({isViewerShow: e.detail.value})
    }
  },
})
