/**
 * popup-title-bar 基础样式复刻（对照 popup.styl 的 title-bar 段）。
 * inline style 值一律 token 变量；无 token 的 60rpx/15rpx/20% 为设计稿字面量
 * （wxml inline style 不经构建管线，px→rpx 需直写 rpx，1px=1rpx 恒等）。
 */
export interface TitleBarStyleInput {
  title: string
  describe: string
  largeRadius: boolean
  onlyClose: boolean
  titleAlign: string
}

export interface TitleBarStyles {
  barStyle: string
  titleWrapStyle: string
  titleStyle: string
  describeStyle: string
  leftStyle: string
  rightStyle: string
  closeStyle: string
}

/** popup.styl：.cu-popup-title-bar &>div（所有子格的公共布局） */
const CELL_BASE =
  'display:flex;height:100%;padding-top:60rpx;flex-direction:column;' +
  'align-items:center;justify-content:flex-start;overflow:hidden;' +
  'text-overflow:ellipsis;word-break:break-word;white-space:nowrap;line-height:1;'

export function buildTitleBarStyles(input: TitleBarStyleInput): TitleBarStyles {
  const isLeft = input.titleAlign === 'left'
  const isRight = input.titleAlign === 'right'

  // popup.styl：.cu-popup-title-bar（height 随 describe 走 large 档）
  const barStyle =
    'position:relative;width:100%;' +
    `height:var(--popup-title-bar-height${input.describe ? '-large' : ''});` +
    'background-color:var(--popup-title-bar-bg);' +
    'border-radius:var(--popup-title-bar-radius-large) var(--popup-title-bar-radius-large) 0 0;' +
    'overflow:hidden;line-height:1;'

  // &.title-align-left/.title-bar-right（display none）/right（.title-bar-left 隐藏）
  const titleAlignExtra = isLeft
    ? 'padding-left:var(--h-gap-sl);align-items:flex-start;'
    : isRight
      ? 'padding-right:var(--h-gap-sl);align-items:flex-end;'
      : ''
  const titleWrapStyle =
    'width:100%;padding-left:20%;padding-right:20%;box-sizing:border-box;line-height:1;' +
    CELL_BASE +
    titleAlignExtra

  const titleStyle =
    'font-size:var(--popup-title-bar-font-size-title);color:var(--popup-title-bar-color-title);'
  const describeStyle =
    'margin-top:15rpx;font-size:var(--popup-title-bar-font-size-describe);' +
    'color:var(--popup-title-bar-color-describe);'

  const sideBase =
    'position:absolute;width:20%;max-height:var(--popup-title-bar-height);' +
    'font-size:var(--popup-title-bar-font-size-button);' +
    'font-weight:var(--popup-title-bar-font-weight-button);box-sizing:border-box;line-height:1;' +
    CELL_BASE

  // .title-bar-left（title-align-left 时隐藏）
  const leftStyle =
    sideBase +
    (isLeft ? 'display:none;' : '') +
    'left:0;padding-left:var(--h-gap-sl);align-items:flex-start;' +
    'color:var(--popup-title-bar-color-button-left);'

  // .title-bar-right（title-align-right 时隐藏；onlyClose 的 close 图标格复用）
  const rightStyle =
    sideBase +
    (isRight ? 'display:none;' : '') +
    'right:0;padding-right:var(--h-gap-sl);align-items:flex-end;'

  // .cu-popup-close
  const closeStyle =
    sideBase + 'padding-top:var(--h-gap-sl);color:var(--popup-title-bar-color-button-left);'

  return {barStyle, titleWrapStyle, titleStyle, describeStyle, leftStyle, rightStyle, closeStyle}
}
