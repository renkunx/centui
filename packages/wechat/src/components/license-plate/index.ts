/**
 * Source: packages/vue/src/components/license-plate/{LicensePlate,LicensePlateInput,LicensePlateKeyboard}.vue
 *
 * 映射：
 *  props    shortcuts(默认 31 省份), modeShow('division'|'popUp'), showPopUp(false),
 *           title('请输入车牌号码'), subtitle(''), defaultValue(''),
 *           disorderClick(true)（顺序填写开关）
 *  events   confirm({value})（Vue 载荷为拼接串裸值）；hide；
 *           sd-keyboard / hd-keyboard（Vue defineEmits 声明但源码从未触发——保留声明不派发）
 *  slots    无
 *
 * 顺序填写契约（packages/vue/test/components/license-plate-order.spec.ts）：
 *  1. disorderClick=true 默认：任意键位可点击；
 *  2. disorderClick=false：仅"前后两位至少一位已填"或第 0 位可选中，被拦截的点击
 *     不切换选中位（但键盘仍展开——对齐 Vue keyMapping 的先后顺序）；
 *  3. onEnter 写入当前位并推进，写满最后一位自动 confirm；
 *  4. onDelete 清空当前位并回退，第 0 位（division）收起键盘。
 *  纯逻辑在 ./logic.ts（logic.spec 覆盖）。
 *
 * 平台差异（有意为之）：
 *  1. LicensePlateInput / LicensePlateKeyboard 拆分为独立组件目录
 *     （license-plate-input / license-plate-keyboard，各自 styl 独立编译）。
 *  2. popUp 模式基于 cu-popup + cu-popup-title-bar（only-close large-radius），
 *     盒样式经 license-plate.wxss 的 .cu-license-plate .cu-popup-box.cu-slide-up 规则
 *     （shared 隔离）承担。
 *  3. division 键盘容器的 fixed 定位/安全区由 license-plate.styl 原样编译（含 legacy
 *     z-index 字面量，属样式源问题，非本组件引入）。
 */
import {CuComponent} from '../../shared/component'
import {
  applyDefaultValue,
  buildKeyboard,
  canSelectBox,
  DEFAULT_SHORTCUTS,
  deleteValue,
  emptyKeyArray,
  enterValue,
  joinPlate,
  type LicenseKeyboard,
} from './logic'

CuComponent({
  options: {virtualHost: true},

  properties: {
    /** 省份简写 */
    shortcuts: {type: Object, value: DEFAULT_SHORTCUTS},
    /** division | popUp */
    modeShow: {type: String, value: 'division'},
    showPopUp: {type: Boolean, value: false},
    title: {type: String, value: '请输入车牌号码'},
    subtitle: {type: String, value: ''},
    defaultValue: {type: String, value: ''},
    /** 顺序填写时不可乱序点击（true=无序放行） */
    disorderClick: {type: Boolean, value: true},
  },

  data: {
    keyArray: emptyKeyArray(),
    selectedIndex: 0,
    showDivisionKeyboard: false,
    keyboard: {shortcuts: [], mixedKeyboard: [], keyboardType: 1} as LicenseKeyboard,
  },

  observers: {
    'selectedIndex, shortcuts'() {
      this.setData({
        keyboard: buildKeyboard(
          this.data.selectedIndex,
          (this.data.shortcuts ?? []) as string[],
        ),
      })
    },
    defaultValue(val: string) {
      // Vue watch defaultValue：非空时按位覆盖
      if (val !== '') {
        this.setData({keyArray: applyDefaultValue(this.data.keyArray, val)})
      }
    },
  },

  lifetimes: {
    attached() {
      this.setData({
        keyArray: applyDefaultValue(emptyKeyArray(), this.data.defaultValue),
        keyboard: buildKeyboard(0, (this.data.shortcuts ?? []) as string[]),
      })
    },
  },

  methods: {
    /** LicensePlateInput key-mapping：键盘展开先于守卫（对齐 Vue 顺序） */
    onKeyMapping(e: WechatMiniprogram.CustomEvent<{index: number}>) {
      const index = Number(e.detail.index)
      if (!this.data.showDivisionKeyboard) {
        this.setData({showDivisionKeyboard: true})
      }
      if (!canSelectBox(this.data.keyArray, index, this.data.disorderClick)) {
        return
      }
      this.setData({selectedIndex: index})
    },

    onEnter(e: WechatMiniprogram.CustomEvent<{value: string | number}>) {
      const result = enterValue(this.data.keyArray, this.data.selectedIndex, e.detail.value)
      this.setData({keyArray: result.keyArray, selectedIndex: result.selectedIndex})
      if (result.confirmed) {
        this.onConfirm()
      }
    },

    onDelete() {
      const result = deleteValue(this.data.keyArray, this.data.selectedIndex, this.data.modeShow)
      const patch: Record<string, unknown> = {
        keyArray: result.keyArray,
        selectedIndex: result.selectedIndex,
      }
      if (result.hideKeyboard) {
        patch.showDivisionKeyboard = false
      }
      this.setData(patch)
    },

    onConfirm() {
      if (this.data.modeShow === 'division') {
        this.setData({showDivisionKeyboard: false})
      }
      this.triggerEvent('confirm', {value: joinPlate(this.data.keyArray)})
    },

    /** popUp 模式标题栏关闭（Vue @cancel="$emit('hide')"） */
    onTitleBarCancel() {
      this.triggerEvent('hide')
    },
  },
})
