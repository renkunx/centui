/* legacy/components/scroll-view/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
Page({
  data: {
  "list": 5,
  "isFinished": false,
  "category": 5,
  "dimensions": [],
  "scrollY": 0,
  "isManual": false,
  "activeBlockIndex": 0,
  "list0": 5,
  "list1": 5
},
  $_onItemClick(i) {
      Toast.info(`Click ${i}`)
    },
  $_onScroll({scrollTop}) {
      if (!this.isManual) {
        this.dimensions.some((dimension, index) => {
          if (scrollTop >= dimension[0] && scrollTop <= dimension[1]) {
            this.activeBlockIndex = index
            return true
          }
        })
      }
    },
  addItems() {
      this.list += 5
      // 如果把autoReflow设置为false, 需调用reflowScroller
      this.$refs.scrollView.reflowScroller()
    },
  $_onRefresh(index) {
      // async data
      setTimeout(() => {
        this[`list${index}`] += 5
        this.$refs[`scrollView${index}`].finishRefresh()
      }, 2000)
    },
  $_onEndReached() {
      if (this.isFinished) {
        return
      }
      // async data
      setTimeout(() => {
        this.list += 5
        if (this.list >= 20) {
          this.isFinished = true
        }
        this.$refs.scrollView.finishLoadMore()
      }, 1000)
    },
  $_initScrollBlock() {
      const blocks = this.$el.querySelectorAll('.scroll-view-category')

      let offset = 0
      Array.prototype.slice.call(blocks).forEach((block, index) => {
        const innerHeight = block.clientHeight
        this.$set(this.dimensions, index, [offset, offset + innerHeight])
        offset += innerHeight
      })

      // setTimeout(() => {
      //   this.$refs.tabBar.reflow()
      // }, 1000)
    },
  $_onScrollStart() {
      this.isManual = false
    },
  $_onTabChange(tab) {
      console.log(tab.name)
      this.$refs[tab.name].init()
    },
  noop() {},
})
