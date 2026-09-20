/**
 * @centui/react 主入口。
 * 样式不内嵌：配合 @centui/styles 使用（与 Vue 包共享同一份 CSS）。
 */
export const VERSION = '0.1.0'

export * from './components/icon/Icon'
export * from './components/activity-indicator/ActivityIndicator'
export * from './components/button/Button'
export * from './components/tag/Tag'
export * from './components/amount/Amount'
export * from './components/cell-item/CellItem'
export * from './components/skeleton/Skeleton'
export * from './components/notice-bar/NoticeBar'
export * from './components/progress/Progress'
export * from './components/switch/Switch'
export * from './components/agree/Agree'
export * from './components/stepper/Stepper'
export * from './components/field/Field'
export * from './components/field-item/FieldItem'
export * from './components/check/Check'
export * from './components/check/CheckList'
export * from './components/radio/Radio'
export * from './components/radio-list/RadioList'
export * from './components/input-item/InputItem'
export * from './components/codebox/Codebox'
export * from './components/number-keyboard/NumberKeyboard'
export * from './components/popup/Popup'
export * from './components/popup/PopupTitleBar'
export * from './components/tip/Tip'
export * from './components/tip/TipContent'
export { CuToast, type ToastProps, type ToastExposed } from './components/toast/Toast'
export { default as Toast } from './components/toast'
export { CuDialog, type DialogProps, type DialogBtn } from './components/dialog/Dialog'
export { default as Dialog } from './components/dialog'
export {
  CuActionSheet,
  type ActionSheetProps,
  type ActionSheetOption,
} from './components/action-sheet/ActionSheet'
export { default as ActionSheet } from './components/action-sheet'
export * from './components/picker/Picker'
export * from './components/picker/DatePicker'

// 滚动类（M6-1）
export { CuScrollView, CuScrollViewRefresh, CuScrollViewMore, type ScrollViewProps } from './components/scroll-view'
export { CuSwiper, CuSwiperItem, type SwiperProps, type SwiperExposed } from './components/swiper/Swiper'
export { CuSlider, type SliderProps } from './components/slider/Slider'

// M6-2 展示与排版类
export { CuActionBar, type ActionBarAction, type ActionBarProps } from './components/action-bar'
export { CuDetailItem, type DetailItemProps } from './components/detail-item'
export {
  CuTextareaItem,
  type TextareaItemProps,
  type TextareaItemExposed,
} from './components/textarea-item'
export { CuSteps, type StepItem, type StepsProps } from './components/steps'
export {
  CuTabs,
  CuTabBar,
  CuTabPane,
  useTabsContext,
  type TabsProps,
  type TabsExposed,
  type TabBarItem,
  type TabBarProps,
  type TabBarExposed,
  type TabPaneProps,
} from './components/tabs'
export { CuTransition, type TransitionProps } from './components/transition'

// M6-3 展示与画布类
export { CuWaterMark, type WaterMarkProps } from './components/water-mark'
export { CuResultPage, type ResultPageButton, type ResultPageProps } from './components/result-page'
export { CuRuler, type RulerProps } from './components/ruler'
export { CuLandscape, type LandscapeProps } from './components/landscape'

// M6-4 交互选择类
export { CuSelector, type SelectorItem, type SelectorProps } from './components/selector'
export {
  CuDropMenu,
  type DropMenuItem,
  type DropMenuProps,
  type DropMenuExposed,
} from './components/drop-menu'
export {
  CuTabPicker,
  type TabPickerNode,
  type TabPickerOption,
  type TabPickerProps,
  type TabPickerExposed,
} from './components/tab-picker'

// M6-5 组合展示类
export { CuBill, type BillProps } from './components/bill'
export { CuImageViewer, type ImageViewerItem, type ImageViewerProps } from './components/image-viewer'
export { CuCaptcha, type CaptchaProps } from './components/captcha'

// M6-6 收官批次
export { CuChart, type ChartDataset, type ChartProps } from './components/chart'
export { CuImageReader, type ImageReaderProps } from './components/image-reader'
export {
  CuLicensePlate,
  CuLicensePlateInput,
  CuLicensePlateKeyboard,
  type LicensePlateProps,
  type LicenseKeyItem,
} from './components/license-plate'
export {
  CuCashier,
  CuCashierChannel,
  CuCashierChannelButton,
  CuCashierChannelItem,
  type CashierProps,
  type CashierScene,
  type CashierChannel,
} from './components/cashier'
export { CuRollerSuccess, type RollerSuccessProps } from './components/activity-indicator'
