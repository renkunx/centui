/**
 * tip 定位与类名测试（对照 Vue 版 Tip.vue layout() + TipContent.vue wrapperCls）
 * 以及 popup-title-bar 基础样式复刻（token 引用与字面量边界）。
 */
import {describe, it, expect} from 'vitest'
import {buildWrapperCls, computeTipStyle} from '../../src/components/tip/logic'
import {buildTitleBarStyles} from '../../src/components/popup-title-bar/logic'

const ref = {width: 100, height: 40, left: 200, top: 300}
const tip = {width: 120, height: 60}

describe('tip/computeTipStyle（Vue layout 公式，fixed 定位）', () => {
  it('top：y -= tipH + 10；x 居中', () => {
    const style = computeTipStyle('top', ref, tip, undefined, false)
    expect(style).toContain('position:fixed')
    expect(style).toContain(`top:${300 - 60 - 10}px`)
    expect(style).toContain(`left:${200 + (100 - 120) / 2}px`)
  })

  it('bottom：y += refH + 10；x 居中', () => {
    const style = computeTipStyle('bottom', ref, tip, undefined, false)
    expect(style).toContain(`top:${300 + 40 + 10}px`)
    expect(style).toContain(`left:${200 + (100 - 120) / 2}px`)
  })

  it('left：垂直居中；x -= tipW + 10', () => {
    const style = computeTipStyle('left', ref, tip, undefined, false)
    expect(style).toContain(`top:${300 + (40 - 60) / 2}px`)
    expect(style).toContain(`left:${200 - 120 - 10}px`)
  })

  it('right：垂直居中；x += refW + 10', () => {
    const style = computeTipStyle('right', ref, tip, undefined, false)
    expect(style).toContain(`top:${300 + (40 - 60) / 2}px`)
    expect(style).toContain(`left:${200 + 100 + 10}px`)
  })

  it('fill：top/bottom 撑宽、left/right 撑高（Vue fill 语义）', () => {
    expect(computeTipStyle('top', ref, tip, undefined, true)).toContain('width:100px;')
    expect(computeTipStyle('left', ref, tip, undefined, true)).toContain('height:40px;')
    expect(computeTipStyle('top', ref, tip, undefined, false)).not.toContain('width:')
  })

  it('offset.top/left 附加（Vue offsetTop/offsetLeft）', () => {
    const style = computeTipStyle('top', ref, tip, {top: 5, left: -3}, false)
    expect(style).toContain(`top:${300 - 70 + 5}px`)
    expect(style).toContain(`left:${200 - 10 - 3}px`)
  })
})

describe('tip/buildWrapperCls（TipContent wrapperCls）', () => {
  it('has-close + placement 修饰类（top 不加 is-）', () => {
    expect(buildWrapperCls(true, 'top', undefined)).toBe('has-close')
    expect(buildWrapperCls(true, 'bottom', undefined)).toBe('has-close is-bottom')
    expect(buildWrapperCls(false, 'left', undefined)).toBe('is-left')
    expect(buildWrapperCls(false, 'right', undefined)).toBe('is-right')
  })

  it('name 进入类名（Vue [String(props.name)]）', () => {
    expect(buildWrapperCls(true, 'top', 'tip-x')).toBe('has-close tip-x')
    expect(buildWrapperCls(false, 'top', 7)).toBe('7')
    expect(buildWrapperCls(false, 'top', '')).toBe('')
  })
})

describe('popup-title-bar/buildTitleBarStyles（popup.styl title-bar 段复刻）', () => {
  const base = {title: 'T', describe: '', largeRadius: false, onlyClose: false, titleAlign: 'center'}

  it('bar：height/bg/radius 全走 token；describe 存在时 large 档', () => {
    const styles = buildTitleBarStyles(base)
    expect(styles.barStyle).toContain('height:var(--popup-title-bar-height)')
    expect(styles.barStyle).toContain('background-color:var(--popup-title-bar-bg)')
    expect(styles.barStyle).toContain('var(--popup-title-bar-radius-large)')
    const large = buildTitleBarStyles({...base, describe: 'D'})
    expect(large.barStyle).toContain('height:var(--popup-title-bar-height-large)')
  })

  it('title/describe 字号色 token；describe margin-top 15rpx 字面量', () => {
    const styles = buildTitleBarStyles(base)
    expect(styles.titleStyle).toContain('font-size:var(--popup-title-bar-font-size-title)')
    expect(styles.titleStyle).toContain('color:var(--popup-title-bar-color-title)')
    expect(styles.describeStyle).toContain('margin-top:15rpx')
    expect(styles.describeStyle).toContain('font-size:var(--popup-title-bar-font-size-describe)')
    expect(styles.describeStyle).toContain('color:var(--popup-title-bar-color-describe)')
  })

  it('titleAlign left：左按钮隐藏、标题左对齐', () => {
    const styles = buildTitleBarStyles({...base, titleAlign: 'left'})
    expect(styles.leftStyle).toContain('display:none')
    expect(styles.titleWrapStyle).toContain('padding-left:var(--h-gap-sl)')
  })

  it('关闭格着色 token（.cu-popup-close）', () => {
    const styles = buildTitleBarStyles(base)
    expect(styles.closeStyle).toContain('color:var(--popup-title-bar-color-button-left)')
  })
})
