import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { normalizeForCompare, readGolden } from './helpers/golden'
import {
  MdActivityIndicator,
  MdAgree,
  MdAmount,
  MdButton,
  MdCellItem,
  MdIcon,
  MdNoticeBar,
  MdProgress,
  MdSkeleton,
  MdStepper,
  MdSwitch,
  MdTag,
} from '../src'

interface V3Scenario {
  name: string
  component: Component
  props?: Record<string, unknown>
  slots?: Record<string, string>
}

/**
 * L3 渲染契约：v3 组件与 test/golden 产出的 v2 基线（mand-mobile@2.7.0）逐场景对比。
 * 场景输入与 test/golden/test/scenarios.ts 一一对应，仅按 v3 API 调整
 * v-model prop 名（value → modelValue）；其余未声明的 props 按 attr 透传，与 v2 行为一致。
 *
 * 已知渲染器差异（空白策略、boolean attr 值、fallthrough class 顺序）在
 * normalizeForCompare 中做等价规范化，不属于契约漂移。
 */
export const v3Scenarios: Record<string, V3Scenario[]> = {
  button: [
    { name: 'default', component: MdButton, slots: { default: '主要按钮' } },
    {
      name: 'primary',
      component: MdButton,
      props: { type: 'primary' },
      slots: { default: '主要按钮' },
    },
    {
      name: 'disabled',
      component: MdButton,
      props: { type: 'primary', disabled: true },
      slots: { default: '主要按钮' },
    },
    {
      name: 'round',
      component: MdButton,
      props: { type: 'primary', round: true },
      slots: { default: '主要按钮' },
    },
    {
      name: 'plain-warn',
      component: MdButton,
      props: { type: 'warning', plain: true },
      slots: { default: '次要按钮' },
    },
  ],
  icon: [
    { name: 'home', component: MdIcon, props: { name: 'home' } },
    { name: 'success-lg', component: MdIcon, props: { name: 'success-color', size: 'lg' } },
    { name: 'spinner-svg', component: MdIcon, props: { name: 'spinner', svg: true } },
  ],
  tag: [
    {
      name: 'fill',
      component: MdTag,
      props: { size: 'tiny', type: 'fill' },
      slots: { default: '标签' },
    },
    {
      name: 'ghost',
      component: MdTag,
      props: { size: 'small', type: 'ghost' },
      slots: { default: '标签' },
    },
  ],
  amount: [
    { name: 'default', component: MdAmount, props: { value: 1234.56 } },
    { name: 'uppercase', component: MdAmount, props: { value: 1234.56, isCapital: true } },
  ],
  'cell-item': [
    {
      name: 'basic',
      component: MdCellItem,
      slots: { title: '标题', brief: '描述文案', right: '内容' },
    },
    {
      name: 'no-border',
      component: MdCellItem,
      props: { noBorder: true },
      slots: { title: '标题' },
    },
  ],
  skeleton: [{ name: 'avatar', component: MdSkeleton, props: { avatar: true, loading: true } }],
  'notice-bar': [
    {
      name: 'basic',
      component: MdNoticeBar,
      slots: { default: '为了确保你的资金安全，请设置支付密码' },
    },
    {
      name: 'closable',
      component: MdNoticeBar,
      props: { mode: 'closable' },
      slots: { default: '为了确保你的资金安全，请设置支付密码' },
    },
  ],
  'activity-indicator': [
    {
      name: 'roller',
      component: MdActivityIndicator,
      props: { type: 'roller', text: '加载中...' },
    },
    {
      name: 'spinner',
      component: MdActivityIndicator,
      props: { type: 'spinner', text: '加载中...' },
    },
  ],
  progress: [{ name: 'bar', component: MdProgress, props: { value: 0.44 } }],
  switch: [
    { name: 'on', component: MdSwitch, props: { modelValue: true } },
    { name: 'off', component: MdSwitch, props: { modelValue: false } },
    { name: 'disabled', component: MdSwitch, props: { modelValue: true, disabled: true } },
  ],
  agree: [
    {
      name: 'checked',
      component: MdAgree,
      // 与 v2 场景一致：checked 未声明为 prop，作为 attr 透传（v2 golden 即如此渲染）
      props: { checked: true },
      slots: { default: '我已阅读并同意协议' },
    },
    {
      name: 'unchecked',
      component: MdAgree,
      slots: { default: '我已阅读并同意协议' },
    },
  ],
  stepper: [
    { name: 'basic', component: MdStepper, props: { modelValue: 3, min: 0, max: 10 } },
    { name: 'disabled', component: MdStepper, props: { modelValue: 3, disabled: true } },
  ],
}

describe('L3 golden 对比（v3 渲染 vs v2 基线）', () => {
  for (const [component, list] of Object.entries(v3Scenarios)) {
    describe(component, () => {
      for (const scenario of list) {
        it(scenario.name, () => {
          const wrapper = mount(scenario.component, {
            props: scenario.props,
            slots: scenario.slots,
          })
          const actual = normalizeForCompare(wrapper.html())
          const baseline = normalizeForCompare(readGolden(component, scenario.name))
          expect(actual).toBe(baseline)
        })
      }
    })
  }
})
