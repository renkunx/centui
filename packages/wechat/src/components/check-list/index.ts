/**
 * Source: packages/vue/src/components/check/CheckList.vue
 *
 * 映射：
 *  props    options([]), modelValue→value(Array, 默认 []), alignCenter(false),
 *           isSlotScope(undefined), icon('checked'), iconInverse('check'),
 *           iconDisabled('check-disabled'), iconSvg（no-op）, iconSize('md'),
 *           iconPosition('right')
 *  events   update:modelValue → change {value}（§3.2 v-model 映射；内嵌
 *           cu-check-group 的 change 原样上抛）
 *  slots    默认插槽（选项内容，缺省回退 text/label 文本）
 *  methods  无（Vue 版 toggle 经内部 ref 直呼 group.toggle；小程序经 relations
 *           回交的组实例等价实现，见差异 4）
 *
 * 结构：内嵌 cu-check-group（Vue CuCheckGroup）+ cu-cell-item（Vue CuCellItem）+
 * cu-check（图标槽，pointer-events:none，点击由 cell-item 承担）。
 *
 * 平台差异：
 *  1. 作用域插槽（option/index/selected）无对应能力——恒按 options 渲染
 *     text/label/brief；默认插槽保留（无 per-item 数据注入）；isSlotScope 属性
 *     保留为 no-op（Vue 中其语义是强制 hasSlot 分支）。
 *  2. .cu-check-item 类无法挂到 cell-item 节点（virtualHost），check.styl 的
 *     list.vue 段以 .cu-check-list 后代选择器等价重写（check-list.styl，
 *     styleIsolation: shared 提升后命中 cu-check / cu-cell-item 内部节点）。
 *  3. Vue :class="{'is-checked': ...}" 挂在 CuCellItem 上（无样式依赖）→ 小程序
 *     无类通道，is-checked 仅保留在 cells 视图数据中（语义保留）。
 *  4. Vue ref="group" 直呼 group.toggle(option.value) → 组实例经 relations
 *     （check-group 侧 '../check-list/index' ancestor linked → receiveCheckGroup）
 *     回交；组未链接时以 check/logic 纯函数乐观回退。
 *  5. cell-item 的 left/right 插槽为静态名（wxml 不支持变量 slot 名），按
 *     iconPosition 双分支渲染。
 */
import {CuComponent} from '../../shared/component'
import {optimisticUpdate} from '../../shared/controlled'
import {toggleName, type CheckValue} from '../check/logic'
import {buildCheckCells, type CheckCellView, type CheckListOption} from './logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

interface GroupLike {
  toggle?: (name: CheckValue) => void
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    options: {type: Object, value: []},
    /** Vue modelValue（Array → Object 构造器，默认 []） */
    value: {type: Object, value: []},
    alignCenter: {type: Boolean, value: false},
    /** 小程序无作用域插槽：保留属性但 no-op（见头注释差异 1） */
    isSlotScope: {type: Boolean, value: false},
    icon: {type: String, value: 'checked'},
    iconInverse: {type: String, value: 'check'},
    iconDisabled: {type: String, value: 'check-disabled'},
    /** Web 语义 no-op（小程序 icon 统一 svg-mask 渲染） */
    iconSvg: {type: Boolean, value: false},
    /** xss | xs | sm | md | lg（透传 cu-check size） */
    iconSize: {type: String, value: 'md'},
    /** left | right */
    iconPosition: {type: String, value: 'right'},
  },

  data: {
    cells: [] as CheckCellView[],
  },

  observers: {
    'options, value, alignCenter, iconPosition'() {
      this.__refreshCells()
    },
  },

  lifetimes: {
    attached() {
      this.__refreshCells()
    },
  },

  methods: {
    __refreshCells() {
      const d = this.data
      this.setData({
        cells: buildCheckCells((d.options as CheckListOption[]) || [], {
          value: (d.value as CheckValue[]) || [],
          alignCenter: !!d.alignCenter,
          iconPosition: d.iconPosition as string,
        }),
      })
    },

    /** check-group 经 relations 回交组实例（对齐 Vue ref="group"，见差异 4） */
    receiveCheckGroup(group: Instance) {
      ;(this as unknown as {__checkListGroup?: GroupLike}).__checkListGroup = group as GroupLike
    },

    /** 内嵌 cu-check-group 的 change 原样上抛（对齐 Vue onInput） */
    onGroupChange(e: WechatMiniprogram.CustomEvent<{value: CheckValue[]}>) {
      this.triggerEvent('change', {value: e.detail.value})
    },

    /** cell-item 点击（Vue @click="check(item)" → group.toggle(option.value)） */
    onOptionTap(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const option = ((this.data.options as CheckListOption[]) || [])[index]
      if (!option || option.disabled) {
        return
      }
      const group = (this as unknown as {__checkListGroup?: GroupLike}).__checkListGroup
      if (group && typeof group.toggle === 'function') {
        group.toggle(option.value)
        return
      }
      // 组未链接的兜底：乐观更新 + emit（受控方回写 value 后 observer 重建 cells）
      const next = toggleName((this.data.value as CheckValue[]) || [], option.value, 0)
      optimisticUpdate(this, {value: next}, 'change', {value: next})
    },
  },
})
