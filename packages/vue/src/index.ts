/**
 * centui v3（Vue 3 版）主入口。
 *
 * 样式不内嵌：请配合 @centui/styles 使用，按需引入
 * `@centui/styles/es/<component>.css` 或全量 `@centui/styles`。
 */
export const VERSION = '3.0.0-alpha.0'

export * from './components/icon'
export * from './components/activity-indicator'
export * from './components/button'
export * from './components/tag'
export * from './components/amount'
export * from './components/cell-item'
export * from './components/skeleton'
export * from './components/notice-bar'
export * from './components/progress'
export * from './components/switch'
export * from './components/agree'
export * from './components/stepper'

// 弹层反馈：Toast/Dialog/ActionSheet 的 default 为命令式 API（工厂/静态方法）
export { CuPopup, CuPopupTitleBar } from './components/popup'
export { CuToast, default as Toast } from './components/toast'
export { CuDialog, default as Dialog } from './components/dialog'
export { CuActionSheet, default as ActionSheet } from './components/action-sheet'
export { CuTip, CuTipContent } from './components/tip'

// 表单基础
export { CuField } from './components/field'
export { CuCheckBaseBox } from './components/check-base'
export {
  CuCheck,
  CuCheckBox,
  CuCheckGroup,
  CuCheckList,
  type CheckListOption,
} from './components/check'
export { CuRadio, CuRadioBox, CuRadioGroup } from './components/radio'
export { CuRadioList, type RadioListOption } from './components/radio-list'
export { CuFieldItem } from './components/field-item'
export { CuInputItem } from './components/input-item'
export {
  CuNumberKeyboard,
  CuNumberKeyboardContainer,
  CuNumberKey,
} from './components/number-keyboard'
export { CuCodebox } from './components/codebox'
export { CuPicker, CuPickerColumn, type PickerColumnItem } from './components/picker'
export { CuDatePicker } from './components/date-picker'

// M6 滚动类
export { CuScrollView, CuScrollViewRefresh, CuScrollViewMore } from './components/scroll-view'
export { CuSwiper, CuSwiperItem } from './components/swiper'
export { CuSlider } from './components/slider'

// M6-2 展示与排版类
export { CuActionBar, type ActionBarAction } from './components/action-bar'
export { CuDetailItem } from './components/detail-item'
export { CuTextareaItem } from './components/textarea-item'
export { CuSteps, type StepItem } from './components/steps'
export { CuTabs, CuTabBar, CuTabPane, type TabBarItem } from './components/tabs'
export { CuTransition } from './components/transition'

// M6-3 展示与画布类
export { CuWaterMark } from './components/water-mark'
export { CuResultPage, type ResultPageButton } from './components/result-page'
export { CuRuler } from './components/ruler'
export { CuLandscape } from './components/landscape'
export { CuSelector, type SelectorItem } from './components/selector'
export { CuDropMenu, type DropMenuItem } from './components/drop-menu'
export { CuTabPicker, type TabPickerNode } from './components/tab-picker'
export { CuBill } from './components/bill'
export { CuImageViewer, type ImageViewerItem } from './components/image-viewer'
export { CuCaptcha } from './components/captcha'
export { CuChart, type ChartDataset } from './components/chart'
export { CuImageReader } from './components/image-reader'
export {
  CuLicensePlate,
  CuLicensePlateInput,
  CuLicensePlateKeyboard,
  type LicenseKeyItem,
} from './components/license-plate'
export {
  CuCashier,
  CuCashierChannel,
  CuCashierChannelButton,
  CuCashierChannelItem,
  type CashierScene,
  type CashierChannel,
} from './components/cashier'
export { CuRollerSuccess } from './components/activity-indicator'
export type { ToastProps } from './components/toast'
export type { DialogBtn, DialogConfirmOptions, DialogAlertOptions } from './components/dialog'
export type { ActionSheetOption, ActionSheetCreateProps } from './components/action-sheet'

export type { ComponentName } from './components'
