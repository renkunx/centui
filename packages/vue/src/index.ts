/**
 * mand-mobile v3（Vue 3 版）主入口。
 *
 * 样式不内嵌：请配合 @mand-mobile/styles 使用，按需引入
 * `@mand-mobile/styles/es/<component>.css` 或全量 `@mand-mobile/styles`。
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
export { MdPopup, MdPopupTitleBar } from './components/popup'
export { MdToast, default as Toast } from './components/toast'
export { MdDialog, default as Dialog } from './components/dialog'
export { MdActionSheet, default as ActionSheet } from './components/action-sheet'
export { MdTip, MdTipContent } from './components/tip'

// 表单基础
export { MdField } from './components/field'
export { MdCheckBaseBox } from './components/check-base'
export {
  MdCheck,
  MdCheckBox,
  MdCheckGroup,
  MdCheckList,
  type CheckListOption,
} from './components/check'
export { MdRadio, MdRadioBox, MdRadioGroup } from './components/radio'
export { MdRadioList, type RadioListOption } from './components/radio-list'
export { MdFieldItem } from './components/field-item'
export { MdInputItem } from './components/input-item'
export {
  MdNumberKeyboard,
  MdNumberKeyboardContainer,
  MdNumberKey,
} from './components/number-keyboard'
export { MdCodebox } from './components/codebox'
export { MdPicker, MdPickerColumn, type PickerColumnItem } from './components/picker'
export { MdDatePicker } from './components/date-picker'

// M6 滚动类
export { MdScrollView, MdScrollViewRefresh, MdScrollViewMore } from './components/scroll-view'
export { MdSwiper, MdSwiperItem } from './components/swiper'
export { MdSlider } from './components/slider'

// M6-2 展示与排版类
export { MdActionBar, type ActionBarAction } from './components/action-bar'
export { MdDetailItem } from './components/detail-item'
export { MdTextareaItem } from './components/textarea-item'
export { MdSteps, type StepItem } from './components/steps'
export { MdTabs, MdTabBar, MdTabPane, type TabBarItem } from './components/tabs'
export { MdTransition } from './components/transition'

// M6-3 展示与画布类
export { MdWaterMark } from './components/water-mark'
export { MdResultPage, type ResultPageButton } from './components/result-page'
export { MdRuler } from './components/ruler'
export { MdLandscape } from './components/landscape'
export type { ToastProps } from './components/toast'
export type { DialogBtn, DialogConfirmOptions, DialogAlertOptions } from './components/dialog'
export type { ActionSheetOption, ActionSheetCreateProps } from './components/action-sheet'

export type { ComponentName } from './components'
