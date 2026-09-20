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

  skeleton: 'display',
  'activity-indicator': 'display',
  progress: 'display',
  'notice-bar': 'display',

  popup: 'overlay',
  toast: 'overlay',
  dialog: 'overlay',
  'action-sheet': 'overlay',
  tip: 'overlay',

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

  picker: 'select',
  'date-picker': 'select',
}