import type { DefineComponent } from 'vue'
import {
  ActionSheet,
  ActivityIndicator,
  Agree,
  Amount,
  Button,
  CellItem,
  Check,
  CheckBox,
  Codebox,
  DatePicker,
  Dialog,
  Field,
  FieldItem,
  Icon,
  InputItem,
  NoticeBar,
  NumberKeyboard,
  Picker,
  Popup,
  PopupTitleBar,
  Progress,
  Radio,
  RadioBox,
  RadioList,
  ScrollView,
  ScrollViewMore,
  ScrollViewRefresh,
  Skeleton,
  Slider,
  Stepper,
  Swiper,
  SwiperItem,
  Switch,
  Tag,
  Toast,
} from 'mand-mobile'

export interface Scenario {
  name: string
  component: DefineComponent
  props?: Record<string, unknown>
  slots?: Record<string, string>
}

/**
 * 首批组件的代表性场景：与 v3 迁移的交付清单对齐。
 * 场景只描述"输入"，HTML 基线由 mand-mobile@2.7.0 渲染产出。
 */
export const scenarios: Record<string, Scenario[]> = {
  button: [
    { name: 'default', component: Button, slots: { default: '主要按钮' } },
    {
      name: 'primary',
      component: Button,
      props: { type: 'primary' },
      slots: { default: '主要按钮' },
    },
    {
      name: 'disabled',
      component: Button,
      props: { type: 'primary', disabled: true },
      slots: { default: '主要按钮' },
    },
    {
      name: 'round',
      component: Button,
      props: { type: 'primary', round: true },
      slots: { default: '主要按钮' },
    },
    {
      name: 'plain-warn',
      component: Button,
      props: { type: 'warning', plain: true },
      slots: { default: '次要按钮' },
    },
  ],
  icon: [
    { name: 'home', component: Icon, props: { name: 'home' } },
    { name: 'success-lg', component: Icon, props: { name: 'success-color', size: 'lg' } },
    { name: 'spinner-svg', component: Icon, props: { name: 'spinner', svg: true } },
  ],
  tag: [
    {
      name: 'fill',
      component: Tag,
      props: { size: 'tiny', type: 'fill' },
      slots: { default: '标签' },
    },
    {
      name: 'ghost',
      component: Tag,
      props: { size: 'small', type: 'ghost' },
      slots: { default: '标签' },
    },
  ],
  amount: [
    { name: 'default', component: Amount, props: { value: 1234.56 } },
    { name: 'uppercase', component: Amount, props: { value: 1234.56, isCapital: true } },
  ],
  'cell-item': [
    {
      name: 'basic',
      component: CellItem,
      slots: { title: '标题', brief: '描述文案', right: '内容' },
    },
    {
      name: 'no-border',
      component: CellItem,
      props: { noBorder: true },
      slots: { title: '标题' },
    },
  ],
  skeleton: [{ name: 'avatar', component: Skeleton, props: { avatar: true, loading: true } }],
  'notice-bar': [
    {
      name: 'basic',
      component: NoticeBar,
      slots: { default: '为了确保你的资金安全，请设置支付密码' },
    },
    {
      name: 'closable',
      component: NoticeBar,
      props: { mode: 'closable' },
      slots: { default: '为了确保你的资金安全，请设置支付密码' },
    },
  ],
  'activity-indicator': [
    { name: 'roller', component: ActivityIndicator, props: { type: 'roller', text: '加载中...' } },
    {
      name: 'spinner',
      component: ActivityIndicator,
      props: { type: 'spinner', text: '加载中...' },
    },
  ],
  progress: [{ name: 'bar', component: Progress, props: { value: 0.44 } }],
  switch: [
    { name: 'on', component: Switch, props: { value: true } },
    { name: 'off', component: Switch, props: { value: false } },
    { name: 'disabled', component: Switch, props: { value: true, disabled: true } },
  ],
  agree: [
    {
      name: 'checked',
      component: Agree,
      props: { checked: true },
      slots: { default: '我已阅读并同意协议' },
    },
    { name: 'unchecked', component: Agree, slots: { default: '我已阅读并同意协议' } },
  ],
  stepper: [
    { name: 'basic', component: Stepper, props: { value: 3, min: 0, max: 10 } },
    { name: 'disabled', component: Stepper, props: { value: 3, disabled: true } },
  ],
  popup: [
    {
      name: 'center-open',
      component: Popup,
      props: { value: true },
      slots: { default: '<p>弹层内容</p>' },
    },
    {
      name: 'bottom-open',
      component: Popup,
      props: { value: true, position: 'bottom' },
      slots: { default: '<p>底部面板</p>' },
    },
    {
      name: 'no-mask-open',
      component: Popup,
      props: { value: true, hasMask: false },
      slots: { default: '<p>无遮罩</p>' },
    },
  ],
  'popup-title-bar': [
    {
      name: 'ok-cancel',
      component: PopupTitleBar,
      props: { title: '标题', okText: '确定', cancelText: '取消' },
    },
    {
      name: 'describe-only-close',
      component: PopupTitleBar,
      props: { title: '标题', describe: '描述文案', onlyClose: true },
    },
  ],
  toast: [
    {
      name: 'closed',
      component: Toast.component as unknown as DefineComponent,
      props: { icon: 'success', content: '操作成功' },
    },
    {
      name: 'slot-closed',
      component: Toast.component as unknown as DefineComponent,
      slots: { default: '<span>自定义</span>' },
    },
  ],
  dialog: [
    {
      name: 'basic-open',
      component: Dialog as unknown as DefineComponent,
      props: {
        value: true,
        title: '对话框标题',
        content: '对话框内容',
        btns: [{ text: '取消' }, { text: '确定' }],
      },
    },
    {
      name: 'warning-open',
      component: Dialog as unknown as DefineComponent,
      props: {
        value: true,
        title: '警告',
        btns: [{ text: '确定', warning: true }],
      },
    },
  ],
  'action-sheet': [
    {
      name: 'open',
      component: ActionSheet,
      props: {
        value: true,
        title: '操作弹层',
        options: [{ text: '选项1' }, { text: '选项2' }, { text: '禁用项', disabled: true }],
        invalidIndex: 2,
      },
    },
  ],
  check: [
    {
      name: 'checked',
      component: Check,
      props: { name: 'day', value: 'day' },
      slots: { default: '日结算' },
    },
    { name: 'unchecked', component: Check, props: { name: 'month' }, slots: { default: '月结算' } },
    {
      name: 'disabled',
      component: Check,
      props: { name: 'day', value: 'day', disabled: true },
      slots: { default: '日结算' },
    },
  ],
  'check-box': [
    {
      name: 'checked',
      component: CheckBox,
      props: { name: 'a', value: ['a'] as never, label: '选项一' },
    },
    {
      name: 'disabled',
      component: CheckBox,
      props: { name: 'b', disabled: true, label: '选项二' },
    },
  ],
  radio: [
    {
      name: 'checked',
      component: Radio,
      props: { name: 'day', value: 'day' },
      slots: { default: '日结算' },
    },
    {
      name: 'unchecked-inline',
      component: Radio,
      props: { name: 'month', inline: true },
      slots: { default: '月结算' },
    },
  ],
  'radio-box': [
    { name: 'checked', component: RadioBox, props: { name: 'a', value: 'a', label: '选项一' } },
  ],
  field: [
    {
      name: 'basic',
      component: Field,
      props: { title: '标题', brief: '描述' },
      slots: { default: '<div>内容</div>', action: '<a>操作</a>' },
    },
    { name: 'plain', component: Field, props: { plain: true }, slots: { default: '<p>内容</p>' } },
  ],
  'field-item': [
    {
      name: 'basic',
      component: FieldItem,
      props: { title: '标题', addon: '附加', arrow: true },
      slots: { default: '内容' },
    },
    {
      name: 'placeholder',
      component: FieldItem,
      props: { title: '标题', placeholder: '占位', solid: true },
    },
  ],
  'number-keyboard': [
    {
      name: 'professional-view',
      component: NumberKeyboard,
      props: { isView: true, value: true },
    },
    {
      name: 'simple-view',
      component: NumberKeyboard,
      props: { isView: true, value: true, type: 'simple' },
    },
  ],
  codebox: [
    { name: 'basic', component: Codebox, props: { value: '12' } },
    { name: 'mask', component: Codebox, props: { value: '1234', mask: true } },
    { name: 'disabled', component: Codebox, props: { value: '1', disabled: true, maxlength: 4 } },
  ],
  'input-item': [
    { name: 'basic', component: InputItem, props: { title: '姓名', placeholder: '请输入' } },
    {
      name: 'phone',
      component: InputItem,
      props: { title: '手机号', type: 'phone', value: '13812345678' },
    },
    {
      name: 'bankcard',
      component: InputItem,
      props: { title: '银行卡', type: 'bankCard', value: '6222021234561234' },
    },
  ],
  'radio-list': [
    {
      name: 'basic',
      component: RadioList,
      props: {
        value: 'a',
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
      component: Picker,
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
  'date-picker': [
    {
      name: 'view',
      component: DatePicker,
      props: {
        isView: true,
        type: 'date',
        defaultDate: new Date(2024, 5, 15),
        minDate: new Date(2020, 0, 1),
        maxDate: new Date(2025, 11, 31),
      },
    },
  ],
  'scroll-view': [
    {
      name: 'basic',
      component: {
        render(h) {
          return h(ScrollView, {}, [
            h('div', { class: 'scroll-item' }, '内容一'),
            h('div', { class: 'scroll-item' }, '内容二'),
            h(
              ScrollViewMore,
              { props: { isFinished: false } },
              ['加载更多'],
            ),
          ])
        },
      } as unknown as DefineComponent,
    },
    {
      name: 'refresh',
      component: {
        render(h) {
          return h(ScrollView, {}, [
            h(
              ScrollViewRefresh,
              { props: { scrollTop: -30 } },
              '下拉刷新',
            ),
            h('div', { class: 'scroll-item' }, '内容'),
          ])
        },
      } as unknown as DefineComponent,
    },
  ],
  swiper: [
    {
      name: 'three-items',
      component: {
        render(h) {
          return h(Swiper, {}, [
            h(SwiperItem, {}, [h('div', { class: 'sw-item' }, '第 1 页')]),
            h(SwiperItem, {}, [h('div', { class: 'sw-item' }, '第 2 页')]),
            h(SwiperItem, {}, [h('div', { class: 'sw-item' }, '第 3 页')]),
          ])
        },
      } as unknown as DefineComponent,
    },
  ],
  slider: [
    { name: 'single', component: Slider, props: { value: 20 } },
    { name: 'range', component: Slider, props: { value: [20, 80], range: true } },
    { name: 'disabled', component: Slider, props: { value: 40, disabled: true } },
  ],
}
