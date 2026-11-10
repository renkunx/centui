/**
 * popup-title-bar 纯逻辑测试：基础样式复刻（inline style 组装）。
 * 对照 popup.styl 的 title-bar 段与 Vue 版 PopupTitleBar.vue 的类切换。
 * 组件实例：observers/attached 驱动 __refresh，confirm/cancel/noop 事件派发。
 */
import {describe, it, expect} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'
import {buildTitleBarStyles} from '../../src/components/popup-title-bar/logic'

const base = {
  title: '标题',
  describe: '',
  largeRadius: false,
  onlyClose: false,
  titleAlign: 'center',
}

describe('popup-title-bar/logic 样式组装', () => {
  it('高度随 describe 走 large 档（token 变量）', () => {
    const normal = buildTitleBarStyles(base)
    expect(normal.barStyle).toContain('--popup-title-bar-height)')
    const large = buildTitleBarStyles({...base, describe: '副标题'})
    expect(large.barStyle).toContain('--popup-title-bar-height-large)')
  })

  it('title-align-left/right 的对齐与侧栏隐藏', () => {
    const left = buildTitleBarStyles({...base, titleAlign: 'left'})
    expect(left.titleWrapStyle).toContain('align-items:flex-start')
    expect(left.leftStyle).toContain('display:none')

    const right = buildTitleBarStyles({...base, titleAlign: 'right'})
    expect(right.titleWrapStyle).toContain('align-items:flex-end')
    expect(right.rightStyle).toContain('display:none')

    const center = buildTitleBarStyles(base)
    expect(center.leftStyle).not.toContain('display:none')
    expect(center.rightStyle).not.toContain('display:none')
  })

  it('侧栏颜色/字号/布局走 token；公共格含 60rpx 顶距', () => {
    const styles = buildTitleBarStyles(base)
    expect(styles.leftStyle).toContain('--popup-title-bar-color-button-left')
    expect(styles.leftStyle).toContain('--popup-title-bar-font-size-button')
    expect(styles.rightStyle).toContain('right:0')
    expect(styles.leftStyle).toContain('left:0')
    expect(styles.titleWrapStyle).toContain('padding-top:60rpx')
    expect(styles.describeStyle).toContain('margin-top:15rpx')
  })

  it('close 格（onlyClose）复用右侧基样式并带顶部间距', () => {
    const styles = buildTitleBarStyles({...base, onlyClose: true})
    expect(styles.closeStyle).toContain('position:absolute')
    expect(styles.closeStyle).toContain('--h-gap-sl')
  })

  it('describe 字号/颜色 token 透传', () => {
    const styles = buildTitleBarStyles({...base, describe: '副标题'})
    expect(styles.describeStyle).toContain('--popup-title-bar-font-size-describe')
    expect(styles.describeStyle).toContain('--popup-title-bar-color-describe')
  })
})

// ---------------------------------------------------------------------------
// popup-title-bar 组件实例（index.ts）：observers / lifetimes / 事件派发
// ---------------------------------------------------------------------------
const comp = await loadComponent(() => import('../../src/components/popup-title-bar/index'))

describe('popup-title-bar 组件实例', () => {
  it('attached：初始样式由 props 组装（title 走 large 档）', () => {
    const inst = mountDef(comp.def, {props: {title: '标题', describe: '副标题', largeRadius: true}})
    inst.attached()
    expect(inst.data.barStyle).toContain('--popup-title-bar-height-large)')
    expect(inst.data.titleWrapStyle).toContain('width:100%')
    expect(inst.data.closeStyle).toContain('position:absolute')
  })

  it('observer：titleAlign 变更重建样式（center → left 隐藏左格）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.leftStyle).not.toContain('display:none')
    inst.setData({titleAlign: 'left'})
    expect(inst.data.leftStyle).toContain('display:none')
    expect(inst.data.titleWrapStyle).toContain('align-items:flex-start')
    inst.setData({titleAlign: 'right'})
    expect(inst.data.rightStyle).toContain('display:none')
  })

  it('observer：describe 空串与非空切换高度档位', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.barStyle).toContain('--popup-title-bar-height)')
    inst.setData({describe: 'd'})
    expect(inst.data.barStyle).toContain('--popup-title-bar-height-large)')
    inst.setData({describe: ''})
    expect(inst.data.barStyle).toContain('--popup-title-bar-height)')
  })

  it('onlyClose observer 透传样式组装', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({onlyClose: true})
    expect(inst.data.closeStyle).toContain('--h-gap-sl')
  })

  it('onCancel / onConfirm / noop 事件与空实现', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.onCancel()
    inst.methods.onConfirm()
    expect(inst.eventsOf('cancel')).toHaveLength(1)
    expect(inst.eventsOf('confirm')).toHaveLength(1)
    expect(() => inst.methods.noop()).not.toThrow()
  })
})
