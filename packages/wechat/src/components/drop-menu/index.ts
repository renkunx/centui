/**
 * Source: packages/vue/src/components/drop-menu/DropMenu.vue
 *
 * 映射：
 *  props    data(DropMenuItem[]), defaultValue(Array<string|number>)
 *  events   change {barItem, listItem}（Vue change(barItem, listItem) 双参合并）；
 *           show / hide（popup 桥接）
 *  slots    默认插槽为作用域插槽（option），不支持——列表恒按选项 text/label
 *           渲染（差异见下）
 *  methods  getSelectedValues() / getSelectedValue(index)
 *
 * 语义对齐：
 *  - bar 点击状态机：关闭态打开并记 activeMenuBarIndex；打开态再点（任意 bar）
 *    收起（对齐 Vue onBarItemClick，二次点击收起）；disabled 项不动。
 *  - 列表项点击：收起 popup、记录选中项、emit change。
 *  - popup before-hide → activeMenuBarIndex = -1（对齐 Vue @before-hide）。
 *  - data/defaultValue 变更（JSON 对比）→ initSelectedBar 重扫。
 *
 * 平台差异：
 *  1. CuPopup → cu-popup 子组件（position top + prevent-scroll 遮罩锁定），
 *     popup change(false) 同步内部 isPopupShow。
 *  2. CuRadioList 不嵌套：样式隔离下 .cu-drop-menu-list .cu-radio-item.is-selected
 *     等后代规则需与节点同树，列表自绘（cell-item.styl/radio.styl 构建期编入）。
 *  3. 作用域插槽（option）无对应能力，恒按选项文本渲染。
 *  4. bar 项下拉箭头为 stylus ::after（span 元素选择器已在 styles 源侧调整为
 *     .bar-item-text 类选择器——小程序无 span 元素，见集成注意事项）。
 */
import {CuComponent} from '../../shared/component'
import {
  barItemTapState,
  barItemText,
  initSelectedBar,
  isBarItemSelected,
  type DropMenuItem,
  type DropMenuListOption,
} from './logic'

interface BarItemView {
  no: number
  text: string
  active: boolean
  selected: boolean
  disabled: boolean
}

/** helper 的结构化上下文（data 以宽松形态访问，方法内 this 已具名类型化） */
interface Ctx {
  data: Record<string, unknown>
  setData(patch: Record<string, unknown>): void
}

function refreshBar(self: Ctx) {
  const d = self.data
  const items = (d.menuData as DropMenuItem[]) || []
  const selectedItems = (d.selectedItems as Array<DropMenuListOption | undefined>) || []
  const defaultValue = (d.selectedValues as Array<string | number>) || []
  const bars: BarItemView[] = items.map((item, index) => ({
    no: index,
    text: barItemText(item, selectedItems[index]),
    active: index === d.activeMenuBarIndex,
    selected: isBarItemSelected(selectedItems[index], defaultValue, index),
    disabled: !!item.disabled,
  }))
  self.setData({bars})
}

function refreshCells(self: Ctx) {
  const d = self.data
  const index = d.activeMenuBarIndex as number
  const items = (d.menuData as DropMenuItem[]) || []
  const barItem = items[index]
  const options = (barItem && (barItem.options ?? [])) as DropMenuListOption[]
  const selectedValue = ((d.selectedValues as Array<string | number>) || [])[index]
  const cells = (options || []).map((option, i) => {
    const value = option.value
    return {
      no: i,
      title: String((option.text || option.label) ?? ''),
      selected: selectedValue !== undefined && value === selectedValue,
    }
  })
  self.setData({cells})
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** DropMenuItem[] */
    data: {type: Object, value: []},
    defaultValue: {type: Object, value: []},
  },

  data: {
    isPopupShow: false,
    activeMenuBarIndex: -1,
    menuData: [] as DropMenuItem[],
    selectedItems: [] as Array<DropMenuListOption | undefined>,
    selectedValues: [] as Array<string | number>,
    bars: [] as BarItemView[],
    cells: [] as Array<{no: number; title: string; selected: boolean}>,
  },

  observers: {
    data(val: DropMenuItem[]) {
      if (JSON.stringify(val) !== JSON.stringify(this.data.menuData)) {
        this.setData({menuData: (val || []).slice() as DropMenuItem[]})
        this.__initSelectedBar()
      }
    },
    defaultValue(val: Array<string | number>) {
      if (JSON.stringify(val) !== JSON.stringify(this.data.selectedValues)) {
        this.__initSelectedBar()
      }
    },
    'activeMenuBarIndex, selectedItems, selectedValues'() {
      refreshBar(this)
      refreshCells(this)
    },
  },

  lifetimes: {
    attached() {
      this.setData({menuData: (this.data.data || []).slice() as DropMenuItem[]})
      this.__initSelectedBar()
    },
  },

  methods: {
    /** 对齐 Vue onMounted initSelectedBar（value/text/label 匹配，仅一层 options） */
    __initSelectedBar() {
      const result = initSelectedBar(
        this.data.menuData,
        (this.data.defaultValue as Array<string | number>) || [],
      )
      this.setData({
        selectedItems: result.selectedItems,
        selectedValues: result.selectedValues,
      })
    },

    onBarItemClick(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const item = ((this.data.menuData as DropMenuItem[]) || [])[index]
      const next = barItemTapState(this.data.isPopupShow, item)
      if (next.show === this.data.isPopupShow && !next.activeIndexSet) {
        return
      }
      const patch: Record<string, unknown> = {isPopupShow: next.show}
      if (next.activeIndexSet) {
        patch.activeMenuBarIndex = index
      }
      this.setData(patch)
    },

    onListItemClick(e: WechatMiniprogram.TouchEvent) {
      const optionIndex = Number(e.currentTarget.dataset.index)
      const index = this.data.activeMenuBarIndex
      const barItem = ((this.data.menuData as DropMenuItem[]) || [])[index]
      const option = (((barItem && barItem.options) || []) as DropMenuListOption[])[optionIndex]
      if (!option) {
        return
      }
      // 对齐 Vue onListItemClick：收起 + 记录 + change
      const selectedItems = (this.data.selectedItems as Array<DropMenuListOption | undefined>).slice()
      const selectedValues = (this.data.selectedValues as Array<string | number>).slice()
      selectedItems[index] = option
      selectedValues[index] = option.value as string | number
      this.setData({
        isPopupShow: false,
        selectedItems,
        selectedValues,
      })
      this.triggerEvent('change', {barItem, listItem: option})
    },

    // ------------------------------------------------------------------
    // popup 事件桥接
    // ------------------------------------------------------------------
    onPopupChange(e: WechatMiniprogram.CustomEvent<{value: boolean}>) {
      if (e.detail && e.detail.value === false) {
        this.setData({isPopupShow: false})
      }
    },

    onPopupShow() {
      this.triggerEvent('show')
    },

    onPopupHide() {
      this.triggerEvent('hide')
    },

    onPopupBeforeHide() {
      // 对齐 Vue @before-hide="activeMenuBarIndex = -1"
      this.setData({activeMenuBarIndex: -1})
    },

    // ------------------------------------------------------------------
    // 公开方法（Vue defineExpose）
    // ------------------------------------------------------------------
    getSelectedValues() {
      return (this.data.selectedItems as Array<DropMenuListOption | undefined>).slice()
    },

    getSelectedValue(index: number) {
      return (this.data.selectedItems as Array<DropMenuListOption | undefined>)[index]
    },
  },
})
