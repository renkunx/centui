import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { normalizeForCompare, readGolden } from './helpers/golden'
import {
  CuActionSheet,
  CuActivityIndicator,
  CuAgree,
  CuAmount,
  CuButton,
  CuCellItem,
  CuCheckBox,
  CuCheck,
  CuCodebox,
  CuDatePicker,
  CuDialog,
  CuField,
  CuFieldItem,
  CuIcon,
  CuInputItem,
  CuNoticeBar,
  CuNumberKeyboard,
  CuPicker,
  CuPopup,
  CuPopupTitleBar,
  CuProgress,
  CuRadioBox,
  CuRadioList,
  CuRadio,
  CuSkeleton,
  CuStepper,
  CuSwitch,
  CuTag,
  CuScrollView,
  CuScrollViewMore,
  CuScrollViewRefresh,
  CuSlider,
  CuSwiper,
  CuSwiperItem,
  CuToast,
  CuActionBar,
  CuDetailItem,
  CuTextareaItem,
  CuSteps,
  CuTabs,
  CuTabBar,
  CuTabPane,
  CuTransition,
  CuResultPage,
  CuLandscape,
  CuSelector,
  CuDropMenu,
  CuCaptcha,
  CuChart,
  CuImageReader,
  CuLicensePlate,
  CuCashier,
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
    { name: 'default', component: CuButton, slots: { default: '主要按钮' } },
    {
      name: 'primary',
      component: CuButton,
      props: { type: 'primary' },
      slots: { default: '主要按钮' },
    },
    {
      name: 'disabled',
      component: CuButton,
      props: { type: 'primary', disabled: true },
      slots: { default: '主要按钮' },
    },
    {
      name: 'round',
      component: CuButton,
      props: { type: 'primary', round: true },
      slots: { default: '主要按钮' },
    },
    {
      name: 'plain-warn',
      component: CuButton,
      props: { type: 'warning', plain: true },
      slots: { default: '次要按钮' },
    },
  ],
  icon: [
    { name: 'home', component: CuIcon, props: { name: 'home' } },
    { name: 'success-lg', component: CuIcon, props: { name: 'success-color', size: 'lg' } },
    { name: 'spinner-svg', component: CuIcon, props: { name: 'spinner', svg: true } },
  ],
  tag: [
    {
      name: 'fill',
      component: CuTag,
      props: { size: 'tiny', type: 'fill' },
      slots: { default: '标签' },
    },
    {
      name: 'ghost',
      component: CuTag,
      props: { size: 'small', type: 'ghost' },
      slots: { default: '标签' },
    },
  ],
  amount: [
    { name: 'default', component: CuAmount, props: { value: 1234.56 } },
    { name: 'uppercase', component: CuAmount, props: { value: 1234.56, isCapital: true } },
  ],
  'cell-item': [
    {
      name: 'basic',
      component: CuCellItem,
      slots: { title: '标题', brief: '描述文案', right: '内容' },
    },
    {
      name: 'no-border',
      component: CuCellItem,
      props: { noBorder: true },
      slots: { title: '标题' },
    },
  ],
  skeleton: [{ name: 'avatar', component: CuSkeleton, props: { avatar: true, loading: true } }],
  'notice-bar': [
    {
      name: 'basic',
      component: CuNoticeBar,
      slots: { default: '为了确保你的资金安全，请设置支付密码' },
    },
    {
      name: 'closable',
      component: CuNoticeBar,
      props: { mode: 'closable' },
      slots: { default: '为了确保你的资金安全，请设置支付密码' },
    },
  ],
  'activity-indicator': [
    {
      name: 'roller',
      component: CuActivityIndicator,
      props: { type: 'roller', text: '加载中...' },
    },
    {
      name: 'spinner',
      component: CuActivityIndicator,
      props: { type: 'spinner', text: '加载中...' },
    },
  ],
  progress: [{ name: 'bar', component: CuProgress, props: { value: 0.44 } }],
  switch: [
    { name: 'on', component: CuSwitch, props: { modelValue: true } },
    { name: 'off', component: CuSwitch, props: { modelValue: false } },
    { name: 'disabled', component: CuSwitch, props: { modelValue: true, disabled: true } },
  ],
  agree: [
    {
      name: 'checked',
      component: CuAgree,
      // 与 v2 场景一致：checked 未声明为 prop，作为 attr 透传（v2 golden 即如此渲染）
      props: { checked: true },
      slots: { default: '我已阅读并同意协议' },
    },
    {
      name: 'unchecked',
      component: CuAgree,
      slots: { default: '我已阅读并同意协议' },
    },
  ],
  stepper: [
    { name: 'basic', component: CuStepper, props: { modelValue: 3, min: 0, max: 10 } },
    { name: 'disabled', component: CuStepper, props: { modelValue: 3, disabled: true } },
  ],
  popup: [
    {
      name: 'center-open',
      component: CuPopup,
      props: { modelValue: true },
      slots: { default: '<p>弹层内容</p>' },
    },
    {
      name: 'bottom-open',
      component: CuPopup,
      props: { modelValue: true, position: 'bottom' },
      slots: { default: '<p>底部面板</p>' },
    },
    {
      name: 'no-mask-open',
      component: CuPopup,
      props: { modelValue: true, hasMask: false },
      slots: { default: '<p>无遮罩</p>' },
    },
  ],
  'popup-title-bar': [
    {
      name: 'ok-cancel',
      component: CuPopupTitleBar,
      props: { title: '标题', okText: '确定', cancelText: '取消' },
    },
    {
      name: 'describe-only-close',
      component: CuPopupTitleBar,
      props: { title: '标题', describe: '描述文案', onlyClose: true },
    },
  ],
  toast: [
    {
      name: 'closed',
      component: CuToast,
      props: { icon: 'success', content: '操作成功' },
    },
    {
      name: 'slot-closed',
      component: CuToast,
      slots: { default: '<span>自定义</span>' },
    },
  ],
  dialog: [
    {
      name: 'basic-open',
      component: CuDialog,
      props: {
        modelValue: true,
        title: '对话框标题',
        content: '对话框内容',
        btns: [{ text: '取消' }, { text: '确定' }],
      },
    },
    {
      name: 'warning-open',
      component: CuDialog,
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
      component: CuActionSheet,
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
      component: CuCheck,
      props: { name: 'day', modelValue: 'day' },
      slots: { default: '日结算' },
    },
    {
      name: 'unchecked',
      component: CuCheck,
      props: { name: 'month' },
      slots: { default: '月结算' },
    },
    {
      name: 'disabled',
      component: CuCheck,
      props: { name: 'day', modelValue: 'day', disabled: true },
      slots: { default: '日结算' },
    },
  ],
  'check-box': [
    // 与 v2 场景一致：未入组的数组 value 不构成选中态
    {
      name: 'checked',
      component: CuCheckBox,
      props: { name: 'a', modelValue: ['a'] as never, label: '选项一' },
    },
    {
      name: 'disabled',
      component: CuCheckBox,
      props: { name: 'b', disabled: true, label: '选项二' },
    },
  ],
  radio: [
    {
      name: 'checked',
      component: CuRadio,
      props: { name: 'day', modelValue: 'day' },
      slots: { default: '日结算' },
    },
    {
      name: 'unchecked-inline',
      component: CuRadio,
      props: { name: 'month', inline: true },
      slots: { default: '月结算' },
    },
  ],
  'radio-box': [
    {
      name: 'checked',
      component: CuRadioBox,
      props: { name: 'a', modelValue: 'a', label: '选项一' },
    },
  ],
  field: [
    {
      name: 'basic',
      component: CuField,
      props: { title: '标题', brief: '描述' },
      slots: { default: '<div>内容</div>', action: '<a>操作</a>' },
    },
    {
      name: 'plain',
      component: CuField,
      props: { plain: true },
      slots: { default: '<p>内容</p>' },
    },
  ],
  'field-item': [
    {
      name: 'basic',
      component: CuFieldItem,
      props: { title: '标题', addon: '附加', arrow: true },
      slots: { default: '内容' },
    },
    {
      name: 'placeholder',
      component: CuFieldItem,
      props: { title: '标题', placeholder: '占位', solid: true },
    },
  ],
  'number-keyboard': [
    {
      name: 'professional-view',
      component: CuNumberKeyboard,
      props: { isView: true, modelValue: true },
    },
    {
      name: 'simple-view',
      component: CuNumberKeyboard,
      props: { isView: true, modelValue: true, type: 'simple' },
    },
  ],
  codebox: [
    { name: 'basic', component: CuCodebox, props: { modelValue: '12' } },
    { name: 'mask', component: CuCodebox, props: { modelValue: '1234', mask: true } },
    {
      name: 'disabled',
      component: CuCodebox,
      props: { modelValue: '1', disabled: true, maxlength: 4 },
    },
  ],
  'input-item': [
    { name: 'basic', component: CuInputItem, props: { title: '姓名', placeholder: '请输入' } },
    {
      name: 'phone',
      component: CuInputItem,
      props: { title: '手机号', type: 'phone', modelValue: '13812345678' },
    },
    {
      name: 'bankcard',
      component: CuInputItem,
      props: { title: '银行卡', type: 'bankCard', modelValue: '6222021234561234' },
    },
  ],
  'radio-list': [
    {
      name: 'basic',
      component: CuRadioList,
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
      component: CuPicker,
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
          '<div class="scroll-item">内容一</div><div class="scroll-item">内容二</div><CuScrollViewMore :is-finished="false" />',
      },
      component: CuScrollView,
    },
    {
      name: 'refresh',
      slots: {
        default: '<CuScrollViewRefresh :scroll-top="-30" /><div class="scroll-item">内容</div>',
      },
      component: CuScrollView,
    },
  ],
  swiper: [
    {
      name: 'three-items',
      slots: {
        default: `
          <CuSwiperItem><div class="sw-item">第 1 页</div></CuSwiperItem>
          <CuSwiperItem><div class="sw-item">第 2 页</div></CuSwiperItem>
          <CuSwiperItem><div class="sw-item">第 3 页</div></CuSwiperItem>
        `,
      },
      component: CuSwiper,
    },
  ],
  slider: [
    { name: 'single', component: CuSlider, props: { modelValue: 20 } },
    { name: 'range', component: CuSlider, props: { modelValue: [20, 80], range: true } },
    { name: 'disabled', component: CuSlider, props: { modelValue: 40, disabled: true } },
  ],
  'action-bar': [
    { name: 'single', component: CuActionBar, props: { actions: [{ text: '主要按钮' }] } },
    {
      name: 'double',
      component: CuActionBar,
      props: { actions: [{ text: '次要按钮' }, { text: '主要按钮' }] },
    },
    {
      name: 'disabled',
      component: CuActionBar,
      props: { actions: [{ text: '禁用按钮', disabled: true }] },
    },
    {
      name: 'with-text',
      component: CuActionBar,
      props: { actions: [{ text: '主要按钮' }] },
      slots: { default: '<p class="bar-text">合计：¥128.00</p>' },
    },
  ],
  'detail-item': [
    { name: 'basic', component: CuDetailItem, props: { title: '标题', content: '内容' } },
    { name: 'bold', component: CuDetailItem, props: { title: '标题', content: '内容', bold: true } },
    { name: 'slot', component: CuDetailItem, props: { title: '标题' }, slots: { default: '插槽内容' } },
  ],
  'textarea-item': [
    { name: 'basic', component: CuTextareaItem, props: { title: '标题', placeholder: '请输入' } },
    { name: 'value', component: CuTextareaItem, props: { title: '标题', value: '预置内容' } },
    {
      name: 'clearable',
      component: CuTextareaItem,
      props: { title: '标题', value: '可清除内容', clearable: true },
    },
    {
      name: 'disabled',
      component: CuTextareaItem,
      props: { title: '标题', value: '禁用内容', disabled: true },
    },
    { name: 'error', component: CuTextareaItem, props: { title: '标题', value: '出错了', error: '错误提示' } },
    { name: 'rows', component: CuTextareaItem, props: { title: '标题', rows: 5, placeholder: '五行' } },
  ],
  steps: [
    {
      name: 'horizontal',
      component: CuSteps,
      props: {
        steps: [{ name: '第一步' }, { name: '第二步' }, { name: '第三步' }],
        current: 1,
      },
    },
    {
      name: 'with-desc',
      component: CuSteps,
      props: {
        steps: [
          { name: '下单', text: '2016-12-12' },
          { name: '付款', text: '2016-12-13' },
          { name: '发货', text: '2016-12-14' },
        ],
        current: 2,
      },
    },
    {
      name: 'vertical',
      component: CuSteps,
      props: {
        steps: [{ name: '第一步' }, { name: '第二步' }, { name: '第三步' }],
        current: 1,
        direction: 'vertical',
      },
    },
    {
      name: 'fraction-current',
      component: CuSteps,
      props: {
        steps: [{ name: '第一步' }, { name: '第二步' }],
        current: 0.5,
      },
    },
  ],
  'tab-bar': [
    {
      name: 'items',
      component: CuTabBar,
      props: {
        items: [
          { name: 'a', label: '第一项' },
          { name: 'b', label: '第二项' },
          { name: 'c', label: '第三项' },
        ],
      },
    },
  ],
  tabs: [
    {
      name: 'basic',
      component: {
        components: { CuTabs, CuTabPane },
        template: `<cu-tabs>
          <cu-tab-pane label="标签一" name="a">内容一</cu-tab-pane>
          <cu-tab-pane label="标签二" name="b">内容二</cu-tab-pane>
        </cu-tabs>`,
      },
    },
    {
      name: 'second-active',
      component: {
        components: { CuTabs, CuTabPane },
        template: `<cu-tabs model-value="b">
          <cu-tab-pane label="标签一" name="a">内容一</cu-tab-pane>
          <cu-tab-pane label="标签二" name="b">内容二</cu-tab-pane>
          <cu-tab-pane label="标签三" name="c">内容三</cu-tab-pane>
        </cu-tabs>`,
      },
    },
    {
      name: 'no-ink',
      component: {
        components: { CuTabs, CuTabPane },
        template: `<cu-tabs :has-ink="false">
          <cu-tab-pane label="标签一" name="a">内容一</cu-tab-pane>
          <cu-tab-pane label="标签二" name="b">内容二</cu-tab-pane>
        </cu-tabs>`,
      },
    },
  ],
  transition: [
    {
      name: 'fade',
      component: {
        components: { CuTransition },
        template: `<cu-transition name="cu-fade"><div class="trans-demo">内容</div></cu-transition>`,
      },
    },
    {
      name: 'bounce',
      component: {
        components: { CuTransition },
        template: `<cu-transition name="cu-bounce"><div class="trans-demo">内容</div></cu-transition>`,
      },
    },
  ],
  'result-page': [
    { name: 'empty', component: CuResultPage },
    { name: 'network', component: CuResultPage, props: { type: 'network' } },
    { name: 'lost', component: CuResultPage, props: { type: 'lost' } },
    {
      name: 'custom',
      component: CuResultPage,
      props: {
        imgUrl: 'https://example.com/a.png',
        text: '自定义标题',
        subtext: '自定义描述',
        buttons: [{ text: '主要按钮' }, { text: '次要按钮', plain: false }],
      },
    },
  ],
  landscape: [
    {
      name: 'closed',
      component: CuLandscape,
      slots: { default: '<p class="ls-content">横屏内容</p>' },
    },
    {
      name: 'open',
      component: CuLandscape,
      props: { modelValue: true },
      slots: { default: '<p class="ls-content">横屏内容</p>' },
    },
    {
      name: 'fullscreen',
      component: CuLandscape,
      props: { modelValue: true, fullScreen: true },
      slots: { default: '<p class="ls-content">横屏内容</p>' },
    },
  ],
  selector: [
    { name: 'closed', component: CuSelector, props: { data: [] } },
    {
      name: 'open',
      component: CuSelector,
      props: {
        modelValue: true,
        title: '选择地区',
        data: [
          { value: '1', text: '选项一' },
          { value: '2', text: '选项二' },
          { value: '3', text: '选项三' },
        ],
        defaultValue: '2',
      },
    },
    {
      name: 'multi-check',
      component: CuSelector,
      props: {
        modelValue: true,
        multi: true,
        title: '多选',
        okText: '确定',
        data: [
          { value: 'a', text: '选项 A' },
          { value: 'b', text: '选项 B' },
        ],
        defaultValue: ['a'],
      },
    },
  ],
  'drop-menu': [
    {
      name: 'bar',
      component: CuDropMenu,
      props: {
        data: [
          { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }] },
          { text: '排序', options: [{ value: '3', text: '默认' }, { value: '4', text: '价格' }] },
          { text: '禁用项', disabled: true, options: [] },
        ],
        defaultValue: ['2'],
      },
    },
  ],
  captcha: [
    {
      name: 'inline',
      component: CuCaptcha,
      props: { isView: true, title: '输入验证码', brief: '验证码已发送至 138****1234', maxlength: 4 },
      slots: { default: '短信验证码已发送' },
    },
  ],
  chart: [
    {
      name: 'basic',
      component: CuChart,
      props: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        datasets: [
          {
            color: '#5b8ff9',
            width: 1,
            values: [120, 350, 420, 260, 180, 300, 450],
          },
        ],
        size: [480, 270],
        max: 500,
        min: 0,
        lines: 5,
        step: 100,
      },
    },
    {
      name: 'region',
      component: CuChart,
      props: {
        labels: ['1', '2', '3', '4'],
        datasets: [
          {
            color: '#fa8919',
            theme: 'region',
            width: 1,
            values: [100, 200, 150, 300],
          },
        ],
        size: [480, 270],
        max: 300,
        min: 0,
        lines: 4,
        step: 75,
      },
    },
  ],
  'image-reader': [
    { name: 'default', component: CuImageReader, props: {} },
  ],
  'license-plate': [
    { name: 'division', component: CuLicensePlate, props: { defaultValue: '浙AD12345' } },
  ],
  cashier: [
    {
      name: 'choose',
      component: CuCashier,
      props: {
        modelValue: true,
        title: '支付',
        paymentAmount: '1000.00',
        channels: [
          { text: '招商银行储蓄卡', desc: '招商银行(1234)' },
          { text: '支付宝', img: 'https://img.alipay.com/static/img/alipay.png' },
        ],
      },
    },
  ],
  'date-picker': [
    {
      name: 'view',
      component: CuDatePicker,
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
        it(scenario.name, async () => {
          const wrapper = mount(scenario.component, {
            props: scenario.props,
            slots: scenario.slots,
            global: {
              components: { CuScrollViewMore, CuScrollViewRefresh, CuSwiperItem },
            },
          })
          // 与 test/golden 采集端一致：等渲染队列与定时器初始化（scroller/swiper init）
          // 落定后再截取
          await new Promise(r => setTimeout(r, 30))
          const actual = normalizeForCompare(wrapper.html())
          const baseline = normalizeForCompare(readGolden(component, scenario.name))
          expect(actual).toBe(baseline)
        })
      }
    })
  }
})
