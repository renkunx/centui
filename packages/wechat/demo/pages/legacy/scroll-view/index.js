/* legacy/components/scroll-view/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

// v-for="i in list"（数字）→ 数组 [1..n]
function seq(n) {
  return Array.from({length: n}, (_, k) => k + 1)
}

function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

Page({
  data: {
    // demo0 基础
    items: seq(5),
    // demo1 横向滚动
    itemsH: seq(5),
    // demo2 下拉刷新
    itemsR: seq(5),
    // demo3 加载更多（legacy list 初始 10）
    itemsMore: seq(10),
    isFinished: false,
    // demo4/demo5 共用（legacy category: 5, list: 5）
    category: seq(5),
    list: seq(5),
    dims4: [],
    scrollY4: 0,
    activeBlockIndex4: 0,
    // demo5
    dims5: [],
    isManual: false,
    activeBlockIndex: 0,
    tabBarItems: [],
    // demo6（legacy list0/list1）
    list0: seq(5),
    list1: seq(5),
  },

  // legacy Toast.info(`Click ${i}`)
  toastInfo(content) {
    const inst = this.selectComponent('#cu-toast')
    inst && inst.show({icon: '', content, duration: 3000})
  },

  // legacy $_initScrollBlock：$el.querySelectorAll('.scroll-view-category') 改为
  // createSelectorQuery().selectAll（slot 内容属页面作用域，可直接选中）
  measureDemo4() {
    const query = this.createSelectorQuery()
    query.selectAll('.md-example-child-scroll-view-4 .scroll-view-category').boundingClientRect()
    query.exec((res) => {
      const rects = (res && res[0]) || []
      const dims = []
      let offset = 0
      rects.forEach((rect) => {
        dims.push([offset, offset + rect.height])
        offset += rect.height
      })
      this.setData({dims4: dims})
    })
  },
  measureDemo5() {
    const query = this.createSelectorQuery()
    query.selectAll('.md-example-child-scroll-view-5 .scroll-view-category').boundingClientRect()
    query.exec((res) => {
      const rects = (res && res[0]) || []
      const dims = []
      let offset = 0
      rects.forEach((rect) => {
        dims.push([offset, offset + rect.height])
        offset += rect.height
      })
      // computed tabBarItems = dimensions.map((item, index) => ({name: index, label: `Block - ${index + 1}`}))
      const tabBarItems = dims.map((item, index) => ({name: index, label: `Block - ${index + 1}`}))
      this.setData({dims5: dims, tabBarItems})
    })
  },

  onReady() {
    this.measureDemo4()
    this.measureDemo5()
  },

  // ---- demo0 基础 ----
  onItemClick0(e) {
    this.toastInfo(`Click ${e.currentTarget.dataset.i}`)
  },
  onScroll0(e) {
    const {scrollLeft, scrollTop} = e.detail
    console.log(`[Mand Mobile ScrollView - demo0 - onScroll] scrollLeft: ${scrollLeft}, scrollTop: ${scrollTop}`)
  },
  addItems0() {
    // legacy list += 5
    this.setData({items: seq(this.data.items.length + 5)})
    const sv = this.selectComponent('#scrollView0')
    sv && sv.reflowScroller()
  },

  // ---- demo2 下拉刷新 ----
  onRefresh2() {
    // async data
    setTimeout(() => {
      this.setData({itemsR: seq(this.data.itemsR.length + 5)})
      const sv = this.selectComponent('#scrollView2')
      sv && sv.finishRefresh()
    }, 2000)
  },
  triggerRefresh2() {
    const sv = this.selectComponent('#scrollView2')
    sv && sv.triggerRefresh()
  },

  // ---- demo3 加载更多 ----
  onEndReached3() {
    if (this.data.isFinished) {
      return
    }
    // async data
    setTimeout(() => {
      const next = this.data.itemsMore.length + 5
      const patch = {itemsMore: seq(next)}
      if (next >= 20) {
        patch.isFinished = true
      }
      this.setData(patch)
      const sv = this.selectComponent('#scrollView3')
      sv && sv.finishLoadMore()
    }, 1000)
  },

  // ---- demo4 粘性标题 ----
  onScroll4(e) {
    const scrollTop = e.detail.scrollTop
    let activeIndex = -1
    this.data.dims4.forEach((dimension, index) => {
      if (scrollTop >= dimension[0] && scrollTop <= dimension[1]) {
        activeIndex = index + 1
      }
    })
    this.setData({scrollY4: scrollTop, activeBlockIndex4: activeIndex})
  },

  // ---- demo5 配合TabBar ----
  onScrollStart5() {
    this.setData({isManual: false})
  },
  onScroll5(e) {
    if (this.data.isManual) return
    const scrollTop = e.detail.scrollTop
    const dims = this.data.dims5
    for (let index = 0; index < dims.length; index++) {
      if (scrollTop >= dims[index][0] && scrollTop <= dims[index][1]) {
        this.setData({activeBlockIndex: index})
        return
      }
    }
  },
  onTabChange5(e) {
    const index = e.detail.index
    this.setData({isManual: true})
    debounce(() => {
      const dims = this.data.dims5
      const offsetTop = dims[index] ? dims[index][0] : 0
      const sv = this.selectComponent('#scrollView5')
      sv && sv.scrollTo(0, offsetTop, true)
    }, 100)()
  },

  // ---- demo6 手动初始化 ----
  onRefresh6Pane0() {
    this.doRefresh6(0)
  },
  onRefresh6Pane1() {
    this.doRefresh6(1)
  },
  doRefresh6(index) {
    // async data
    setTimeout(() => {
      const key = index === 0 ? 'list0' : 'list1'
      this.setData({[key]: seq(this.data[key].length + 5)})
      const sv = this.selectComponent(index === 0 ? '#scrollView0-6' : '#scrollView1-6')
      sv && sv.finishRefresh()
    }, 2000)
  },
  onTabChange6(e) {
    // legacy：console.log(tab.name); this.$refs[tab.name].init()
    const name = e.detail.tab.name
    console.log(name)
    const id = name === 'scrollView0' ? 'scrollView0-6' : 'scrollView1-6'
    const sv = this.selectComponent('#' + id)
    sv && sv.init()
  },
})
