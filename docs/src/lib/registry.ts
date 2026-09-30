/**
 * 组件注册表：文档站唯一数据源。
 * gen.mjs 据此生成组件内容页（mdx）+ API 表；侧边栏由 Starlight autogenerate。
 *
 * 结构约定：
 * - name        组件目录名（kebab-case，对应 packages/vue/src/components/<name>）
 * - entry       入口文件相对路径（默认 index.ts）
 * - demo        演示文件（docs/src/components/demos/<name>/index.vue，由 writer 编写）
 * - zh/en       标题与简介（双语）
 */
export interface ComponentMeta {
  name: string
  zh: string
  en: string
  zhDesc: string
  enDesc: string
  /**
   * true = 页面 mdx 与 API JSON 由 writer 手工维护（含 events/methods 的完整契约），
   * gen.mjs 跳过重新生成，仅登记进 registry（首页索引 / 分组）。
   */
  curated?: boolean
}

export interface GroupMeta {
  id: string
  zh: string
  en: string
  order: number
}

export const GROUPS: GroupMeta[] = [
  { id: 'basic', zh: '基础组件', en: 'Basic', order: 1 },
  { id: 'display', zh: '数据展示', en: 'Display', order: 2 },
  { id: 'overlay', zh: '弹层反馈', en: 'Overlay & Feedback', order: 3 },
  { id: 'form', zh: '表单', en: 'Form', order: 4 },
  { id: 'select', zh: '选择器', en: 'Selectors', order: 5 },
]

export const COMPONENTS: ComponentMeta[] = [
  // ---------------- 基础组件 ----------------
  {
    name: 'button',
    zh: '按钮',
    en: 'Button',
    zhDesc: '按钮组件，支持基础、图标、加载、禁用等多种形态与大小。',
    enDesc:
      'Button component supporting multiple variants (default, primary, warning, disabled), icon, loading and sizes.',
  },
  {
    name: 'action-bar',
    zh: '操作栏',
    en: 'ActionBar',
    zhDesc: '底部操作栏，聚合主/次操作与金额信息，常用于收银与详情页。',
    enDesc: 'Bottom action bar aggregating primary/secondary actions and amount info.',
    curated: true,
  },
  {
    name: 'icon',
    zh: '图标',
    en: 'Icon',
    zhDesc: '图标组件，内置字体图标，支持大小与颜色定制。',
    enDesc: 'Icon component with built-in font icons, customizable size and color.',
  },
  {
    name: 'tag',
    zh: '标签',
    en: 'Tag',
    zhDesc: '标签组件，用于标记状态、分类或信息提示。',
    enDesc: 'Tag component for marking status, categories or info hints.',
  },
  {
    name: 'amount',
    zh: '金额',
    en: 'Amount',
    zhDesc: '金额展示组件，支持千分位、小数位、人民币符号与省略模式。',
    enDesc: 'Amount formatter component with grouping separators, decimals, currency symbols and ellipsis mode.',
  },
  {
    name: 'cell-item',
    zh: '单元格',
    en: 'CellItem',
    zhDesc: '列表单元格组件，支持标题、附加说明、操作位与箭头。',
    enDesc: 'List cell item with title, addon, action slot and arrow indicator.',
  },
  {
    name: 'detail-item',
    zh: '清单项',
    en: 'DetailItem',
    zhDesc: '清单项组件，以键值对形式展示账单/记录明细。',
    enDesc: 'Detail list item rendering key-value pairs for bills and records.',
    curated: true,
  },
  {
    name: 'tabs',
    zh: '标签页',
    en: 'Tabs',
    zhDesc: '标签页组件，配合 TabPane 实现内容切换，支持墨条指示与多标签滚动。',
    enDesc: 'Tabs component with TabPane, ink-bar indicator and scrollable tab list.',
    curated: true,
  },
  {
    name: 'tab-bar',
    zh: '标签栏',
    en: 'TabBar',
    zhDesc: '标签栏组件，Tabs 的导航条部分，可单独用于自定义内容切换。',
    enDesc: 'Tab bar, the navigation part of Tabs, usable standalone for custom panels.',
    curated: true,
  },

  // ---------------- 数据展示 ----------------
  {
    name: 'skeleton',
    zh: '骨架屏',
    en: 'Skeleton',
    zhDesc: '骨架屏组件，为加载中的内容提供占位结构。',
    enDesc: 'Skeleton screen providing placeholder structure for loading content.',
  },
  {
    name: 'activity-indicator',
    zh: '加载指示',
    en: 'ActivityIndicator',
    zhDesc: '加载指示器，支持旋转与滚动两种形态，用于加载状态反馈。',
    enDesc: 'Loading indicator with spinner and roller styles for loading feedback.',
  },
  {
    name: 'progress',
    zh: '进度条',
    en: 'Progress',
    zhDesc: '进度条组件，展示任务进度，支持不同尺寸与颜色。',
    enDesc: 'Progress bar component showing task progress with multiple sizes and colors.',
  },
  {
    name: 'notice-bar',
    zh: '通告栏',
    en: 'NoticeBar',
    zhDesc: '通告栏组件，用于展示滚动公告或提示信息，支持关闭。',
    enDesc: 'Notice bar for showing scrolling announcements or alerts, closable.',
  },
  {
    name: 'bill',
    zh: '票据',
    en: 'Bill',
    zhDesc: '电子票据组件，展示账单主体与流水明细列表。',
    enDesc: 'Electronic bill component showing bill header and detail list.',
    curated: true,
  },
  {
    name: 'chart',
    zh: '折线图表',
    en: 'Chart',
    zhDesc: '折线图表组件，基于 SVG 渲染，支持坐标轴与渐变面积。',
    enDesc: 'SVG-based line chart with axes and gradient area support.',
    curated: true,
  },
  {
    name: 'image-viewer',
    zh: '图片浏览器',
    en: 'ImageViewer',
    zhDesc: '图片浏览器组件，全屏查看多张图片，支持双指缩放与页码。',
    enDesc: 'Fullscreen image viewer with pinch zoom and page indicator.',
    curated: true,
  },
  {
    name: 'result-page',
    zh: '结果页',
    en: 'ResultPage',
    zhDesc: '结果页组件，展示操作成功/失败等结果与后续操作引导。',
    enDesc: 'Result page showing success/failure outcomes and follow-up actions.',
    curated: true,
  },
  {
    name: 'scroll-view',
    zh: '滚动区域',
    en: 'ScrollView',
    zhDesc: '滚动区域组件，支持下拉刷新、加载更多与自定义内容。',
    enDesc: 'Scrollable region with pull-to-refresh, load-more and custom content.',
    curated: true,
  },
  {
    name: 'steps',
    zh: '步骤条',
    en: 'Steps',
    zhDesc: '步骤条组件，横向展示流程进度，支持自定义图标与文案。',
    enDesc: 'Horizontal steps indicator with custom icon and text support.',
    curated: true,
  },
  {
    name: 'swiper',
    zh: '轮播',
    en: 'Swiper',
    zhDesc: '轮播组件，支持横/纵向滑动、自动播放与无缝循环。',
    enDesc: 'Swiper with vertical/horizontal sliding, autoplay and seamless loop.',
    curated: true,
  },
  {
    name: 'water-mark',
    zh: '水印',
    en: 'WaterMark',
    zhDesc: '水印组件，全屏覆盖半透明水印文字或图案。',
    enDesc: 'Fullscreen semi-transparent watermark with text or pattern.',
    curated: true,
  },

  // ---------------- 弹层反馈 ----------------
  {
    name: 'popup',
    zh: '弹层',
    en: 'Popup',
    zhDesc: '通用弹层容器，支持底部、中部、漂浮等多种定位及遮罩。',
    enDesc: 'Popup container with bottom, center, float positioning and overlay.',
  },
  {
    name: 'toast',
    zh: '轻提示',
    en: 'Toast',
    zhDesc: '轻提示组件，以命令式方式调用，支持多种图标与自定义图片。',
    enDesc: 'Toast notifications with imperative API, icon variants and custom image.',
  },
  {
    name: 'dialog',
    zh: '对话框',
    en: 'Dialog',
    zhDesc: '对话框组件，支持确认、警告等常用操作及自定义内容。',
    enDesc: 'Dialog component with confirm/alert variants and customizable content.',
  },
  {
    name: 'action-sheet',
    zh: '动作面板',
    en: 'ActionSheet',
    zhDesc: '动作面板组件，用于从底部弹出多个操作项，命令式调用。',
    enDesc: 'Action sheet for pulling up a set of actions from the bottom, imperative API.',
  },
  {
    name: 'tip',
    zh: '气泡提示',
    en: 'Tip',
    zhDesc: '气泡提示组件，围绕目标元素展示文字说明，可配置方向。',
    enDesc: 'Tip bubble anchoring to an element with direction options.',
  },
  {
    name: 'captcha',
    zh: '验证码窗口',
    en: 'Captcha',
    zhDesc: '验证码窗口组件，短信验证码倒计时输入与校验。',
    enDesc: 'Captcha dialog with SMS countdown input and verification.',
    curated: true,
  },
  {
    name: 'cashier',
    zh: '收银台',
    en: 'Cashier',
    zhDesc: '收银台组件，支付渠道选择、支付中/成功/失败场景切换。',
    enDesc: 'Cashier with channel selection and paying/success/fail scenes.',
    curated: true,
  },
  {
    name: 'landscape',
    zh: '压屏窗',
    en: 'Landscape',
    zhDesc: '压屏窗组件，全屏弹层展示详情内容，支持滚动区域。',
    enDesc: 'Landscape fullscreen overlay for detail content with scroll region.',
    curated: true,
  },
  {
    name: 'transition',
    zh: '动画',
    en: 'Transition',
    zhDesc: '动画组件，内置常用过渡（fade/slide/up-down 等）与弹出动画。',
    enDesc: 'Built-in transitions (fade/slide/up-down etc.) for overlays.',
    curated: true,
  },

  // ---------------- 表单 ----------------
  {
    name: 'field',
    zh: '表单容器',
    en: 'Field',
    zhDesc: '表单容器组件，提供标题、描述与内容插槽布局。',
    enDesc: 'Form field container with title, description and content slots.',
  },
  {
    name: 'field-item',
    zh: '表单项',
    en: 'FieldItem',
    zhDesc: '表单项组件，提供标题、占位与箭头布局。',
    enDesc: 'Form field item with title, placeholder and arrow indicator.',
  },
  {
    name: 'input-item',
    zh: '输入框',
    en: 'InputItem',
    zhDesc: '输入框组件，支持手机号、银行卡、金额等输入格式。',
    enDesc: 'Input item supporting phone, bank card and money formats.',
  },
  {
    name: 'check-base',
    zh: '复选基础',
    en: 'CheckBase',
    zhDesc: '复选基础容器，为自定义内容提供勾选状态角标样式。',
    enDesc: 'Check base container adding a check badge to custom content.',
  },
  {
    name: 'check',
    zh: '复选框',
    en: 'Check',
    zhDesc: '复选框组件，可选择多个选项，可与表单数据绑定。',
    enDesc: 'Checkbox component supporting multiple selection and data binding.',
  },
  {
    name: 'radio',
    zh: '单选框',
    en: 'Radio',
    zhDesc: '单选框组件，一组中只能选中一个选项。',
    enDesc: 'Radio component, only one option can be selected in a group.',
  },
  {
    name: 'radio-list',
    zh: '单选列表',
    en: 'RadioList',
    zhDesc: '单选列表组件，自定义内容选择列表，支持底部说明与关联选择。',
    enDesc: 'Radio list component with customizable options, footer note and nested selection.',
  },
  {
    name: 'agree',
    zh: '同意协议',
    en: 'Agree',
    zhDesc: '同意协议组件，用于注册、登录等场景的确认勾选。',
    enDesc: 'Agreement checkbox for registration/login consent scenarios.',
  },
  {
    name: 'switch',
    zh: '开关',
    en: 'Switch',
    zhDesc: '开关组件，用于切换单选状态。',
    enDesc: 'Switch component for toggling a boolean state.',
  },
  {
    name: 'stepper',
    zh: '步进器',
    en: 'Stepper',
    zhDesc: '步进器组件，支持数量增减、禁用状态与自定义步长。',
    enDesc: 'Stepper for quantity adjustments with disable state and custom step.',
  },
  {
    name: 'codebox',
    zh: '验证码',
    en: 'Codebox',
    zhDesc: '验证码输入组件，满位自动提交，支持掩码显示。',
    enDesc: 'Verification code input, auto-submits when full, supports masking.',
  },
  {
    name: 'number-keyboard',
    zh: '数字键盘',
    en: 'NumberKeyboard',
    zhDesc: '数字键盘组件，支持随机键位与简单模式，可内嵌或弹出。',
    enDesc: 'Number keyboard with disorder keys and simple mode, inline or popup.',
  },
  {
    name: 'image-reader',
    zh: '图片选择器',
    en: 'ImageReader',
    zhDesc: '图片选择组件，读取本地图片并压缩，支持多选与校验。',
    enDesc: 'Image picker reading local files with compression and validation.',
    curated: true,
  },
  {
    name: 'license-plate',
    zh: '车牌键盘',
    en: 'LicensePlate',
    zhDesc: '车牌号输入组件，含省份简称键盘与能源类型切换。',
    enDesc: 'License plate input with province keyboard and energy-type toggle.',
    curated: true,
  },
  {
    name: 'ruler',
    zh: '刻度尺',
    en: 'Ruler',
    zhDesc: '刻度尺组件，拖动选择数值，支持范围、步长与刻度文案。',
    enDesc: 'Ruler for picking a value by dragging, with scope/step/step-text.',
    curated: true,
  },
  {
    name: 'slider',
    zh: '滑块',
    en: 'Slider',
    zhDesc: '滑块组件，拖动选择数值或数值范围。',
    enDesc: 'Slider for picking a value or a value range.',
    curated: true,
  },
  {
    name: 'textarea-item',
    zh: '文本域',
    en: 'TextareaItem',
    zhDesc: '多行文本域组件，支持字数统计、自动增高与清除按钮。',
    enDesc: 'Multi-line textarea with count, autosize and clear button.',
    curated: true,
  },

  // ---------------- 选择器 ----------------
  {
    name: 'picker',
    zh: '选择器',
    en: 'Picker',
    zhDesc: '多列选择器组件，以滚动方式选取数据。',
    enDesc: 'Multi-column picker with scrollable column selection.',
  },
  {
    name: 'date-picker',
    zh: '日期选择器',
    en: 'DatePicker',
    zhDesc: '日期时间选择器组件，支持日期、时间与日期时间类型。',
    enDesc: 'Date/time picker supporting date, time and datetime types.',
  },
  {
    name: 'drop-menu',
    zh: '下拉菜单',
    en: 'DropMenu',
    zhDesc: '下拉菜单组件，多栏目筛选，点击栏头展开选项列表。',
    enDesc: 'Drop-down menu for multi-column filtering with bar triggers.',
    curated: true,
  },
  {
    name: 'selector',
    zh: '列表选择器',
    en: 'Selector',
    zhDesc: '列表选择器组件，弹层展示多级/多选列表，支持搜索与自定义。',
    enDesc: 'Popup list selector with multi-level/multi-choice and search.',
    curated: true,
  },
  {
    name: 'tab-picker',
    zh: '多频道选择器',
    en: 'TabPicker',
    zhDesc: '多频道选择器组件，弹层内多标签页级联选择。',
    enDesc: 'Tab picker with cascading selection across popup tabs.',
    curated: true,
  },
]

/** 按组分组的组件列表 */
export function groupComponents(): Record<string, ComponentMeta[]> {
  const groups: Record<string, ComponentMeta[]> = {}
  for (const g of GROUPS) groups[g.id] = []
  for (const c of COMPONENTS) {
    groups[GROUP_OF[c.name]]?.push(c)
  }
  return groups
}

export const GROUP_OF: Record<string, string> = {
  button: 'basic',
  icon: 'basic',
  tag: 'basic',
  amount: 'basic',
  'cell-item': 'basic',
  'action-bar': 'basic',
  'detail-item': 'basic',
  tabs: 'basic',
  'tab-bar': 'basic',

  skeleton: 'display',
  'activity-indicator': 'display',
  progress: 'display',
  'notice-bar': 'display',
  bill: 'display',
  chart: 'display',
  'image-viewer': 'display',
  'result-page': 'display',
  'scroll-view': 'display',
  steps: 'display',
  swiper: 'display',
  'water-mark': 'display',

  popup: 'overlay',
  toast: 'overlay',
  dialog: 'overlay',
  'action-sheet': 'overlay',
  tip: 'overlay',
  captcha: 'overlay',
  cashier: 'overlay',
  landscape: 'overlay',
  transition: 'overlay',

  field: 'form',
  'field-item': 'form',
  'input-item': 'form',
  'check-base': 'form',
  check: 'form',
  radio: 'form',
  'radio-list': 'form',
  agree: 'form',
  switch: 'form',
  stepper: 'form',
  codebox: 'form',
  'number-keyboard': 'form',
  'image-reader': 'form',
  'license-plate': 'form',
  ruler: 'form',
  slider: 'form',
  'textarea-item': 'form',

  picker: 'select',
  'date-picker': 'select',
  'drop-menu': 'select',
  selector: 'select',
  'tab-picker': 'select',
}