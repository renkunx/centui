/**
 * @mand-mobile/react 主入口。
 * 样式不内嵌：配合 @mand-mobile/styles 使用（与 Vue 包共享同一份 CSS）。
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
export { MdToast, type ToastProps, type ToastExposed } from './components/toast/Toast'
export { default as Toast } from './components/toast'
export { MdDialog, type DialogProps, type DialogBtn } from './components/dialog/Dialog'
export { default as Dialog } from './components/dialog'
export {
  MdActionSheet,
  type ActionSheetProps,
  type ActionSheetOption,
} from './components/action-sheet/ActionSheet'
export { default as ActionSheet } from './components/action-sheet'
export * from './components/picker/Picker'
export * from './components/picker/DatePicker'

// 滚动类（M6-1）
export { MdScrollView, MdScrollViewRefresh, MdScrollViewMore, type ScrollViewProps } from './components/scroll-view'
export { MdSwiper, MdSwiperItem, type SwiperProps, type SwiperExposed } from './components/swiper/Swiper'
export { MdSlider, type SliderProps } from './components/slider/Slider'

// M6-2 展示与排版类
export { MdActionBar, type ActionBarAction, type ActionBarProps } from './components/action-bar'
export { MdDetailItem, type DetailItemProps } from './components/detail-item'
export {
  MdTextareaItem,
  type TextareaItemProps,
  type TextareaItemExposed,
} from './components/textarea-item'
export { MdSteps, type StepItem, type StepsProps } from './components/steps'
export {
  MdTabs,
  MdTabBar,
  MdTabPane,
  useTabsContext,
  type TabsProps,
  type TabsExposed,
  type TabBarItem,
  type TabBarProps,
  type TabBarExposed,
  type TabPaneProps,
} from './components/tabs'
export { MdTransition, type TransitionProps } from './components/transition'

// M6-3 展示与画布类
export { MdWaterMark, type WaterMarkProps } from './components/water-mark'
export { MdResultPage, type ResultPageButton, type ResultPageProps } from './components/result-page'
export { MdRuler, type RulerProps } from './components/ruler'
export { MdLandscape, type LandscapeProps } from './components/landscape'

// M6-4 交互选择类
export { MdSelector, type SelectorItem, type SelectorProps } from './components/selector'
export {
  MdDropMenu,
  type DropMenuItem,
  type DropMenuProps,
  type DropMenuExposed,
} from './components/drop-menu'
export {
  MdTabPicker,
  type TabPickerNode,
  type TabPickerOption,
  type TabPickerProps,
  type TabPickerExposed,
} from './components/tab-picker'

// M6-5 组合展示类
export { MdBill, type BillProps } from './components/bill'
export { MdImageViewer, type ImageViewerItem, type ImageViewerProps } from './components/image-viewer'
export { MdCaptcha, type CaptchaProps } from './components/captcha'
