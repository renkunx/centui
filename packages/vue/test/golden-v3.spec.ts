import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { normalizeForCompare, readGolden } from './helpers/golden'
import {
  MdActionSheet,
  MdActivityIndicator,
  MdAgree,
  MdAmount,
  MdButton,
  MdCellItem,
  MdCheckBox,
  MdCheck,
  MdCodebox,
  MdDatePicker,
  MdDialog,
  MdField,
  MdFieldItem,
  MdIcon,
  MdInputItem,
  MdNoticeBar,
  MdNumberKeyboard,
  MdPicker,
  MdPopup,
  MdPopupTitleBar,
  MdProgress,
  MdRadioBox,
  MdRadioList,
  MdRadio,
  MdSkeleton,
  MdStepper,
  MdSwitch,
  MdTag,
  MdScrollView,
  MdScrollViewMore,
  MdScrollViewRefresh,
  MdSlider,
  MdSwiper,
  MdSwiperItem,
  MdToast,
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
  popup: [
    {
      name: 'center-open',
      component: MdPopup,
      props: { modelValue: true },
      slots: { default: '<p>弹层内容</p>' },
    },
    {
      name: 'bottom-open',
      component: MdPopup,
      props: { modelValue: true, position: 'bottom' },
      slots: { default: '<p>底部面板</p>' },
    },
    {
      name: 'no-mask-open',
      component: MdPopup,
      props: { modelValue: true, hasMask: false },
      slots: { default: '<p>无遮罩</p>' },
    },
  ],
  'popup-title-bar': [
    {
      name: 'ok-cancel',
      component: MdPopupTitleBar,
      props: { title: '标题', okText: '确定', cancelText: '取消' },
    },
    {
      name: 'describe-only-close',
      component: MdPopupTitleBar,
      props: { title: '标题', describe: '描述文案', onlyClose: true },
    },
  ],
  toast: [
    {
      name: 'closed',
      component: MdToast,
      props: { icon: 'success', content: '操作成功' },
    },
    {
      name: 'slot-closed',
      component: MdToast,
      slots: { default: '<span>自定义</span>' },
    },
  ],
  dialog: [
    {
      name: 'basic-open',
      component: MdDialog,
      props: {
        modelValue: true,
        title: '对话框标题',
        content: '对话框内容',
        btns: [{ text: '取消' }, { text: '确定' }],
      },
    },
    {
      name: 'warning-open',
      component: MdDialog,
      props: {
        modelValue: true,
        title: '警告',
        btns: [{ text: '确定', warning: true }],
      },
    },
  ],
  'action-sheet': [
    {
      name: 'open',
      component: MdActionSheet,
      props: {
        modelValue: true,
        title: '操作弹层',
        options: [{ text: '选项1' }, { text: '选项2' }, { text: '禁用项', disabled: true }],
        invalidIndex: 2,
      },
    },
  ],
  check: [
    {
      name: 'checked',
      component: MdCheck,
      props: { name: 'day', modelValue: 'day' },
      slots: { default: '日结算' },
    },
    {
      name: 'unchecked',
      component: MdCheck,
      props: { name: 'month' },
      slots: { default: '月结算' },
    },
    {
      name: 'disabled',
      component: MdCheck,
      props: { name: 'day', modelValue: 'day', disabled: true },
      slots: { default: '日结算' },
    },
  ],
  'check-box': [
    // 与 v2 场景一致：未入组的数组 value 不构成选中态
    {
      name: 'checked',
      component: MdCheckBox,
      props: { name: 'a', modelValue: ['a'] as never, label: '选项一' },
    },
    {
      name: 'disabled',
      component: MdCheckBox,
      props: { name: 'b', disabled: true, label: '选项二' },
    },
  ],
  radio: [
    {
      name: 'checked',
      component: MdRadio,
      props: { name: 'day', modelValue: 'day' },
      slots: { default: '日结算' },
    },
    {
      name: 'unchecked-inline',
      component: MdRadio,
      props: { name: 'month', inline: true },
      slots: { default: '月结算' },
    },
  ],
  'radio-box': [
    {
      name: 'checked',
      component: MdRadioBox,
      props: { name: 'a', modelValue: 'a', label: '选项一' },
    },
  ],
  field: [
    {
      name: 'basic',
      component: MdField,
      props: { title: '标题', brief: '描述' },
      slots: { default: '<div>内容</div>', action: '<a>操作</a>' },
    },
    {
      name: 'plain',
      component: MdField,
      props: { plain: true },
      slots: { default: '<p>内容</p>' },
    },
  ],
  'field-item': [
    {
      name: 'basic',
      component: MdFieldItem,
      props: { title: '标题', addon: '附加', arrow: true },
      slots: { default: '内容' },
    },
    {
      name: 'placeholder',
      component: MdFieldItem,
      props: { title: '标题', placeholder: '占位', solid: true },
    },
  ],
  'number-keyboard': [
    {
      name: 'professional-view',
      component: MdNumberKeyboard,
      props: { isView: true, modelValue: true },
    },
    {
      name: 'simple-view',
      component: MdNumberKeyboard,
      props: { isView: true, modelValue: true, type: 'simple' },
    },
  ],
  codebox: [
    { name: 'basic', component: MdCodebox, props: { modelValue: '12' } },
    { name: 'mask', component: MdCodebox, props: { modelValue: '1234', mask: true } },
    {
      name: 'disabled',
      component: MdCodebox,
      props: { modelValue: '1', disabled: true, maxlength: 4 },
    },
  ],
  'input-item': [
    { name: 'basic', component: MdInputItem, props: { title: '姓名', placeholder: '请输入' } },
    {
      name: 'phone',
      component: MdInputItem,
      props: { title: '手机号', type: 'phone', modelValue: '13812345678' },
    },
    {
      name: 'bankcard',
      component: MdInputItem,
      props: { title: '银行卡', type: 'bankCard', modelValue: '6222021234561234' },
    },
  ],
  'radio-list': [
    {
      name: 'basic',
      component: MdRadioList,
      props: {
        modelValue: 'a',
        options: [
          { value: 'a', text: '选项一' },
          { value: 'b', text: '选项二' },
        ],
      },
    },
  ],
  picker: [
    {
      name: 'view',
      component: MdPicker,
      props: {
        isView: true,
        cols: 2,
        data: [
          [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
          [{ text: '1' }, { text: '2' }],
        ],
        defaultValue: ['B', '2'],
      },
    },
  ],
  'scroll-view': [
    {
      name: 'basic',
      slots: {
        default:
          '<div class="scroll-item">内容一</div><div class="scroll-item">内容二</div><MdScrollViewMore :is-finished="false" />',
      },
      component: MdScrollView,
    },
    {
      name: 'refresh',
      slots: {
        default: '<MdScrollViewRefresh :scroll-top="-30" /><div class="scroll-item">内容</div>',
      },
      component: MdScrollView,
    },
  ],
  swiper: [
    {
      name: 'three-items',
      slots: {
        default: `
          <MdSwiperItem><div class="sw-item">第 1 页</div></MdSwiperItem>
          <MdSwiperItem><div class="sw-item">第 2 页</div></MdSwiperItem>
          <MdSwiperItem><div class="sw-item">第 3 页</div></MdSwiperItem>
        `,
      },
      component: MdSwiper,
    },
  ],
  slider: [
    { name: 'single', component: MdSlider, props: { modelValue: 20 } },
    { name: 'range', component: MdSlider, props: { modelValue: [20, 80], range: true } },
    { name: 'disabled', component: MdSlider, props: { modelValue: 40, disabled: true } },
  ],
  'date-picker': [
    {
      name: 'view',
      component: MdDatePicker,
      props: {
        isView: true,
        type: 'date',
        defaultDate: new Date(2024, 5, 15),
        minDate: new Date(2020, 0, 1),
        maxDate: new Date(2025, 11, 31),
      },
    },
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
            global: {
              components: { MdScrollViewMore, MdScrollViewRefresh, MdSwiperItem },
            },
          })
          const actual = normalizeForCompare(wrapper.html())
          const baseline = normalizeForCompare(readGolden(component, scenario.name))
          expect(actual).toBe(baseline)
        })
      }
    })
  }
})
