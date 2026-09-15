import type { DefineComponent } from 'vue'
import {
  ActivityIndicator,
  Agree,
  Amount,
  Button,
  CellItem,
  Icon,
  NoticeBar,
  Progress,
  Skeleton,
  Stepper,
  Switch,
  Tag,
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
    { name: 'primary', component: Button, props: { type: 'primary' }, slots: { default: '主要按钮' } },
    { name: 'disabled', component: Button, props: { type: 'primary', disabled: true }, slots: { default: '主要按钮' } },
    { name: 'round', component: Button, props: { type: 'primary', round: true }, slots: { default: '主要按钮' } },
    { name: 'plain-warn', component: Button, props: { type: 'warning', plain: true }, slots: { default: '次要按钮' } },
  ],
  icon: [
    { name: 'home', component: Icon, props: { name: 'home' } },
    { name: 'success-lg', component: Icon, props: { name: 'success-color', size: 'lg' } },
    { name: 'spinner-svg', component: Icon, props: { name: 'spinner', svg: true } },
  ],
  tag: [
    { name: 'fill', component: Tag, props: { size: 'tiny', type: 'fill' }, slots: { default: '标签' } },
    { name: 'ghost', component: Tag, props: { size: 'small', type: 'ghost' }, slots: { default: '标签' } },
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
    { name: 'basic', component: NoticeBar, slots: { default: '为了确保你的资金安全，请设置支付密码' } },
    { name: 'closable', component: NoticeBar, props: { mode: 'closable' }, slots: { default: '为了确保你的资金安全，请设置支付密码' } },
  ],
  'activity-indicator': [
    { name: 'roller', component: ActivityIndicator, props: { type: 'roller', text: '加载中...' } },
    { name: 'spinner', component: ActivityIndicator, props: { type: 'spinner', text: '加载中...' } },
  ],
  progress: [{ name: 'bar', component: Progress, props: { value: 0.44 } }],
  switch: [
    { name: 'on', component: Switch, props: { value: true } },
    { name: 'off', component: Switch, props: { value: false } },
    { name: 'disabled', component: Switch, props: { value: true, disabled: true } },
  ],
  agree: [
    { name: 'checked', component: Agree, props: { checked: true }, slots: { default: '我已阅读并同意协议' } },
    { name: 'unchecked', component: Agree, slots: { default: '我已阅读并同意协议' } },
  ],
  stepper: [
    { name: 'basic', component: Stepper, props: { value: 3, min: 0, max: 10 } },
    { name: 'disabled', component: Stepper, props: { value: 3, disabled: true } },
  ],
}
