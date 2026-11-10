/**
 * Source: packages/vue/src/components/check/CheckGroup.vue
 *
 * 映射：
 *  props    modelValue→value(Array → Object 构造器，默认 []), max(0)
 *  events   update:modelValue → change {value}（§3.2 v-model 映射）
 *  slots    默认插槽（承载 cu-check / cu-check-box）
 *  methods  toggle(name) / toggleAll(checked?)（Vue defineExpose 同名；
 *           this.selectComponent('#g').toggleAll(true)）
 *
 * provide('rootGroup') → relations：登记后代 cu-check（linked 登记、unlinked 解除，
 * 对齐 Vue register/unregister 与 detached 清理）；value observer 向子项广播组值。
 * 受控/非受控：check/uncheck/toggle/toggleAll 均为「乐观 setData + emit change」，
 * 受控方回写后 observer 以最终值为准并重新广播。
 *
 * 平台差异：
 *  1. Vue 登记表存 {name, disabled} getter 代理，小程序改为持有子组件实例、
 *     toggleAll 时实时读取 name/disabled（等价响应式 getter）。
 *  2. relations 登记 cu-check / cu-check-box 两种后代（check-box 与 check 同协议）；
 *     cu-check-list 内嵌本组件，经 '../check-list/index'（ancestor）把组实例回交
 *     父级（receiveCheckGroup，对齐 Vue CheckList ref="group"）。
 */
import {CuComponent} from '../../shared/component'
import {
  checkName,
  toggleAllValues,
  toggleName,
  uncheckName,
  type CheckChildRecord,
  type CheckValue,
} from '../check/logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

function children(ctx: unknown): Instance[] {
  const self = ctx as {__checkChildren?: Instance[]}
  if (!self.__checkChildren) self.__checkChildren = []
  return self.__checkChildren
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue：数组（小程序属性构造器限制为 Object） */
    value: {type: Object, value: []},
    max: {type: Number, value: 0},
  },

  observers: {
    value(val: CheckValue[]) {
      this.__propagate(val || [])
    },
  },

  relations: {
    '../check/index': {
      type: 'descendant',
      linked(this: {data?: Record<string, unknown>}, target: Instance) {
        children(this).push(target)
        if (typeof target.receiveGroupValue === 'function') {
          target.receiveGroupValue(((this.data ?? {}).value as CheckValue[]) || [])
        }
      },
      unlinked(this: unknown, target: Instance) {
        const list = children(this)
        const i = list.indexOf(target)
        if (i !== -1) list.splice(i, 1)
      },
    },
    // cu-check-box 与 cu-check 同协议（receiveGroupValue / data.name/disabled），
    // 登记 cu-check-box 以纳入组值广播与 toggleAll 子项清单
    '../check-box/index': {
      type: 'descendant',
      linked(this: {data?: Record<string, unknown>}, target: Instance) {
        children(this).push(target)
        if (typeof target.receiveGroupValue === 'function') {
          target.receiveGroupValue(((this.data ?? {}).value as CheckValue[]) || [])
        }
      },
      unlinked(this: unknown, target: Instance) {
        const list = children(this)
        const i = list.indexOf(target)
        if (i !== -1) list.splice(i, 1)
      },
    },
    // cu-check-list 内嵌 cu-check-group：本关系把组实例回交父级 check-list
    // （receiveCheckGroup），对齐 Vue CheckList 的 ref="group" 通道
    '../check-list/index': {
      type: 'ancestor',
      linked(this: Instance, parent: Instance) {
        if (typeof parent.receiveCheckGroup === 'function') {
          parent.receiveCheckGroup(this)
        }
      },
    },
  },

  methods: {
    __propagate(val: CheckValue[]) {
      for (const child of children(this)) {
        if (typeof child.receiveGroupValue === 'function') {
          child.receiveGroupValue(val)
        }
      }
    },

    /** 乐观写回组值并广播（受控方回写后 observer 覆盖） */
    __commit(next: CheckValue[]) {
      this.setData({value: next})
      this.triggerEvent('change', {value: next})
    },

    check(name: CheckValue) {
      const next = checkName((this.data.value as CheckValue[]) || [], name, this.data.max)
      if (next !== this.data.value) {
        this.__commit(next)
      }
    },

    uncheck(name: CheckValue) {
      const next = uncheckName((this.data.value as CheckValue[]) || [], name)
      if (next !== this.data.value) {
        this.__commit(next)
      }
    },

    toggle(name: CheckValue) {
      const next = toggleName((this.data.value as CheckValue[]) || [], name, this.data.max)
      if (next !== this.data.value) {
        this.__commit(next)
      }
    },

    /** 子组件（cu-check）点击上报：按当前组值裁决 check/uncheck（对齐 rootGroup.toggle） */
    toggleChild(name: CheckValue) {
      this.toggle(name)
    },

    /** 对齐 Vue defineExpose.toggleAll：disabled 子项保持原状 */
    toggleAll(checked?: boolean) {
      const records: CheckChildRecord[] = children(this).map((child) => ({
        name: (child.data as Record<string, unknown>).name as CheckValue,
        disabled: !!(child.data as Record<string, unknown>).disabled,
      }))
      const next = toggleAllValues(records, (this.data.value as CheckValue[]) || [], checked)
      this.__commit(next)
    },
  },
})
