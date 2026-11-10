/**
 * Source: packages/vue/src/components/radio/RadioGroup.vue
 *
 * 映射：
 *  props    modelValue→value(String|Number|Boolean, 默认 ''), max（Vue 版声明未使用，
 *           保留对齐）
 *  events   update:modelValue → change {value}（§3.2 v-model 映射）
 *  slots    默认插槽（承载 cu-radio / cu-radio-box）
 *
 * provide('rootGroup') → relations：登记后代 cu-radio / cu-radio-box（linked 登记、
 * unlinked 解除），value observer 向子项广播组值。受控/非受控：check 走
 * 「乐观 setData + emit change」。
 *
 * 平台差异：无（checkChild 为子组件上报入口，语义对齐 Vue rootGroup.check）。
 */
import {CuComponent} from '../../shared/component'
import type {RadioValue} from '../radio/logic'

type Instance = WechatMiniprogram.Component.TrivialInstance

function children(ctx: unknown): Instance[] {
  const self = ctx as {__radioChildren?: Instance[]}
  if (!self.__radioChildren) self.__radioChildren = []
  return self.__radioChildren
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    /** Vue modelValue */
    value: {type: String, optionalTypes: [Number, Boolean], value: ''},
    /** Vue 版声明但未使用，保留 API 对齐 */
    max: {type: Number, value: 0},
  },

  observers: {
    value(val: RadioValue) {
      for (const child of children(this)) {
        if (typeof child.receiveGroupValue === 'function') {
          child.receiveGroupValue(val)
        }
      }
    },
  },

  relations: {
    '../radio/index': {
      type: 'descendant',
      linked(this: {data?: Record<string, unknown>}, target: Instance) {
        children(this).push(target)
        if (typeof target.receiveGroupValue === 'function') {
          target.receiveGroupValue(((this.data ?? {}).value as RadioValue) ?? '')
        }
      },
      unlinked(this: unknown, target: Instance) {
        const list = children(this)
        const i = list.indexOf(target)
        if (i !== -1) list.splice(i, 1)
      },
    },
    // cu-radio-box 与 cu-radio 同协议（receiveGroupValue / checkChild），
    // 登记 cu-radio-box 以纳入组值广播
    '../radio-box/index': {
      type: 'descendant',
      linked(this: {data?: Record<string, unknown>}, target: Instance) {
        children(this).push(target)
        if (typeof target.receiveGroupValue === 'function') {
          target.receiveGroupValue(((this.data ?? {}).value as RadioValue) ?? '')
        }
      },
      unlinked(this: unknown, target: Instance) {
        const list = children(this)
        const i = list.indexOf(target)
        if (i !== -1) list.splice(i, 1)
      },
    },
  },

  methods: {
    /** 对齐 Vue rootGroup.check：直接以 name 作为组值提交 */
    check(name: RadioValue) {
      if (this.data.value !== name) {
        this.setData({value: name})
        this.triggerEvent('change', {value: name})
      }
    },

    /** 子组件（cu-radio）点击上报入口 */
    checkChild(name: RadioValue) {
      this.check(name)
    },
  },
})
