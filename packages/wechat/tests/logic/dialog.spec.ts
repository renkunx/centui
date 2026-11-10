/**
 * dialog 纯逻辑测试：工厂 Promise 语义（Vant 惯例：确认 resolve / 取消 reject）
 * 与 icon 预设浅拷贝（对齐修复后的 Vue 版 succeed/failed）、按钮归一化。
 */
import {describe, it, expect, vi} from 'vitest'
import {loadComponent, mountDef, tapEvent, type Mounted} from '../helpers/weapp'
import {
  normalizeDialogBtns,
  isBtnBlocked,
  btnLoadingColor,
  stripTransition,
} from '../../src/components/dialog/logic'
import {DialogFactory, type DialogConfirmOptions} from '../../src/components/dialog/factory'

interface FakeComp {
  shown: Record<string, unknown>[]
  hideCount: number
  show(options: Record<string, unknown>): void
  hide(): void
}

function fakeComp(): FakeComp {
  return {
    shown: [],
    hideCount: 0,
    show(options) {
      this.shown.push(options)
    },
    hide() {
      this.hideCount++
    },
  }
}

function fakeContext(comp: FakeComp) {
  return {selectComponent: () => comp} as unknown as WechatMiniprogram.Component.TrivialInstance
}

describe('dialog/logic', () => {
  it('normalizeDialogBtns：渲染字段可序列化，handler 抽离登记', () => {
    const handler = () => false
    const {views, handlers} = normalizeDialogBtns([
      {text: '取消'},
      {text: '确定', warning: true, handler},
      undefined as never,
    ])
    expect(views).toEqual([
      {text: '取消', icon: '', disabled: false, warning: false, loading: false},
      {text: '确定', icon: '', disabled: false, warning: true, loading: false},
      {text: '', icon: '', disabled: false, warning: false, loading: false},
    ])
    expect(handlers[0]).toBeUndefined()
    expect(handlers[1]).toBe(handler)
    // 可序列化（setData 约束）
    expect(JSON.parse(JSON.stringify(views))).toEqual(views)
  })

  it('warning 修饰不与 disabled 同现（Vue :class 条件）', () => {
    const {views} = normalizeDialogBtns([{text: 'A', disabled: true, warning: true}])
    expect(views[0]).toMatchObject({disabled: true, warning: false})
  })

  it('isBtnBlocked：disabled/loading 阻断（Vue onClickBtn）', () => {
    expect(isBtnBlocked({text: '', icon: '', disabled: true, warning: false, loading: false})).toBe(true)
    expect(isBtnBlocked({text: '', icon: '', disabled: false, warning: false, loading: true})).toBe(true)
    expect(isBtnBlocked({text: '', icon: '', disabled: false, warning: false, loading: false})).toBe(false)
  })

  it('btnLoadingColor：末位（确认）highlight，其余 minor（token）', () => {
    expect(btnLoadingColor(1, 2)).toBe('var(--dialog-action-highlight-color)')
    expect(btnLoadingColor(0, 2)).toBe('var(--color-text-minor)')
  })

  it('stripTransition：剥 cu- 前缀 + 兜底', () => {
    expect(stripTransition('cu-bounce', 'fade')).toBe('bounce')
    expect(stripTransition('cu-fade', 'bounce')).toBe('fade')
    expect(stripTransition(undefined, 'bounce')).toBe('bounce')
  })
})

describe('dialog 工厂 Promise 语义（DialogFactory）', () => {
  it('confirm：默认 取消/确定 按钮与 locale；确认按钮 resolve', async () => {
    const comp = fakeComp()
    const onConfirm = vi.fn()
    const promise = DialogFactory.confirm(fakeContext(comp), {title: '确认', content: '内容', onConfirm})

    expect(comp.shown).toHaveLength(1)
    const shown = comp.shown[0]
    expect(shown.title).toBe('确认')
    const btns = shown.btns as Array<{text: string; handler: () => boolean | void}>
    expect(btns[0].text).toBe('取消')
    expect(btns[1].text).toBe('确定')

    btns[1].handler()
    await expect(promise).resolves.toBeUndefined()
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(comp.hideCount).toBe(1)
  })

  it('confirm：取消按钮 reject {type:"cancel"}，onCancel 先于关闭', async () => {
    const comp = fakeComp()
    const onCancel = vi.fn()
    const promise = DialogFactory.confirm(fakeContext(comp), {onCancel})

    const btns = comp.shown[0].btns as Array<{handler: () => boolean | void}>
    btns[0].handler()
    await expect(promise).rejects.toEqual({type: 'cancel'})
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(comp.hideCount).toBe(1)
  })

  it('onConfirm/onCancel 返回 false 阻止关闭，Promise 保持 pending', async () => {
    const comp = fakeComp()
    const promise = DialogFactory.confirm(fakeContext(comp), {
      onConfirm: () => false,
      onCancel: () => false,
    })

    const btns = comp.shown[0].btns as Array<{handler: () => boolean | void}>
    btns[1].handler()
    btns[0].handler()
    expect(comp.hideCount).toBe(0)

    let settled = false
    promise.then(
      () => (settled = true),
      () => (settled = true),
    )
    await Promise.resolve()
    expect(settled).toBe(false)
  })

  it('非按钮关闭（_onHide）按 cancel reject 并注销（closeAll 幂等）', async () => {
    const comp = fakeComp()
    const promise = DialogFactory.confirm(fakeContext(comp), {})
    ;(comp.shown[0]._onHide as () => void)()
    await expect(promise).rejects.toEqual({type: 'cancel'})

    // _onHide 后实例已注销（对齐 Vue onHide 移除登记），closeAll 无实例可关
    DialogFactory.closeAll()
    expect(comp.hideCount).toBe(0)
  })

  it('closeAll：活跃实例逐个 close（Vue value 幂等，二次 closeAll 不重复 hide）', async () => {
    const comp = fakeComp()
    const pending = DialogFactory.confirm(fakeContext(comp), {title: 'A'})
    pending.catch(() => {}) // closeAll 以 cancel reject，避免未处理拒绝
    DialogFactory.closeAll()
    expect(comp.hideCount).toBe(1)
    DialogFactory.closeAll()
    expect(comp.hideCount).toBe(1)
  })

  it('succeed/failed：icon 预设注入浅拷贝，不改写入参', async () => {
    const comp = fakeComp()
    const options = {title: 'T', content: 'C'} as DialogConfirmOptions
    DialogFactory.succeed(fakeContext(comp), options)
    expect((options as {icon?: string}).icon).toBeUndefined()
    expect((options as {content?: string}).content).toBe('C')
    expect(comp.shown[0].icon).toBe('success-color')
    expect(comp.shown[0].title).toBe('T')

    const comp2 = fakeComp()
    const options2 = {title: 'T2', icon: 'custom'}
    DialogFactory.failed(fakeContext(comp2), options2)
    expect(options2.icon).toBe('custom')
    expect(comp2.shown[0].icon).toBe('warn-color')
  })

  it('alert：单按钮，任何关闭路径均 resolve', async () => {
    const comp = fakeComp()
    const promise = DialogFactory.alert(fakeContext(comp), {content: 'C'})

    const btns = comp.shown[0].btns as Array<{text: string; handler: () => boolean | void}>
    expect(btns).toHaveLength(1)
    expect(btns[0].text).toBe('确定')
    // 非按钮关闭（如 closeAll）也 resolve
    ;(comp.shown[0]._onHide as () => void)()
    await expect(promise).resolves.toBeUndefined()
  })

  it('组件缺失时 reject（含告警）', async () => {
    const context = {selectComponent: () => null} as unknown as WechatMiniprogram.Component.TrivialInstance
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(DialogFactory.confirm(context, {})).rejects.toThrow('未找到')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('selector 选项转发 generate：自定义选择器生效', async () => {
    // DialogGenerateOptions.selector 声明自定义选择器，confirm/alert 组装时须转发
    const comp = fakeComp()
    const selectors: string[] = []
    const context = {
      selectComponent(selector: string) {
        selectors.push(selector)
        return comp
      },
    } as unknown as WechatMiniprogram.Component.TrivialInstance
    const promise = DialogFactory.alert(context, {selector: '#my-dialog'})
    expect(selectors).toEqual(['#my-dialog'])
    ;(comp.shown[0]._onHide as () => void)()
    await expect(promise).resolves.toBeUndefined()
  })

  it('onShow / onHide 选项经 _onShow/_onHide 钩子调用；confirm 按钮与 alert 按钮均可关闭', async () => {
    const comp = fakeComp()
    const onShow = vi.fn()
    const onHide = vi.fn()
    const promise = DialogFactory.confirm(fakeContext(comp), {onShow, onHide})

    // transition 缺省剥前缀兜底 bounce（confirm 默认无 transition）
    expect(comp.shown[0].transition).toBe('bounce')

    ;(comp.shown[0]._onShow as () => void)()
    expect(onShow).toHaveBeenCalledTimes(1)
    expect(comp.shown[0]._onShow).toBeTypeOf('function')

    // 确认按钮 resolve + hide；_onHide 触发 onHide 选项
    const btns = comp.shown[0].btns as Array<{handler: () => boolean | void}>
    btns[1].handler()
    await expect(promise).resolves.toBeUndefined()
    expect(comp.hideCount).toBe(1)

    // alert：单按钮 handler（onConfirm 返回非 false → resolve + hide）
    const comp2 = fakeComp()
    const promise2 = DialogFactory.alert(fakeContext(comp2), {onConfirm: () => true})
    const btns2 = comp2.shown[0].btns as Array<{handler: () => boolean | void}>
    btns2[0].handler()
    await expect(promise2).resolves.toBeUndefined()
    expect(comp2.hideCount).toBe(1)
  })

  it('onHide 选项在非按钮关闭（_onHide）路径调用', async () => {
    const comp = fakeComp()
    const onHide = vi.fn()
    const promise = DialogFactory.confirm(fakeContext(comp), {onHide})
    promise.catch(() => {})
    ;(comp.shown[0]._onHide as () => void)()
    await expect(promise).rejects.toEqual({type: 'cancel'})
    expect(onHide).toHaveBeenCalledTimes(1)
  })

  it("transition 'cu-bounce' 剥前缀传入 show（stripTransition 工厂侧）", async () => {
    const comp = fakeComp()
    DialogFactory.alert(fakeContext(comp), {transition: 'cu-fade'})
    expect(comp.shown[0].transition).toBe('fade')
  })
})

// ---------------------------------------------------------------------------
// dialog 组件实例（index.ts）：observers / lifetimes / 按钮 / popup 桥接
// ---------------------------------------------------------------------------
const comp = await loadComponent(() => import('../../src/components/dialog/index'))

function state(inst: Mounted): {handlers: unknown[]; onShow?: () => void; onHide?: () => void} {
  return (inst as unknown as {__dialogState?: {handlers: unknown[]; onShow?: () => void; onHide?: () => void}})
    .__dialogState ?? {handlers: []}
}

describe('dialog 组件显隐状态', () => {
  it('attached 初始化：innerShow 同步 show，transitionName 剥前缀，btns 归一化', () => {
    const inst = mountDef(comp.def, {
      props: {show: true, transition: 'cu-bounce', btns: [{text: '确定'}]},
    })
    inst.attached()
    expect(inst.data.innerShow).toBe(true)
    expect(inst.data.transitionName).toBe('bounce')
    expect(inst.data.btnViews).toEqual([
      {text: '确定', icon: '', disabled: false, warning: false, loading: false},
    ])
    expect(inst.data.btnColors).toEqual(['var(--dialog-action-highlight-color)'])
    expect(inst.data.confirmText).toBe('确定')
    expect(inst.data.cancelText).toBe('取消')
  })

  it('observer show：外部回写同步 innerShow', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({show: true})
    expect(inst.data.innerShow).toBe(true)
    inst.setData({show: false})
    expect(inst.data.innerShow).toBe(false)
  })

  it('observer transition：cu- 前缀剥除；空串兜底 fade', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({transition: 'cu-slide-up'})
    expect(inst.data.transitionName).toBe('slide-up')
    inst.setData({transition: ''})
    expect(inst.data.transitionName).toBe('fade')
  })

  it('btns observer 先于 attached：handler 无法登记（state 未建，防御分支）', () => {
    const inst = mountDef(comp.def)
    inst.setData({btns: [{text: 'OK', handler: () => true}]})
    expect(inst.data.btnViews[0].text).toBe('OK')
    expect(state(inst).handlers).toEqual([]) // state 未建，未登记
    inst.attached() // attached 不覆盖已有 btnViews，仅建 state + 归一化
    inst.setData({btns: [{text: 'OK', handler: () => true}]})
    expect(state(inst).handlers).toHaveLength(1)
  })

  it('hide：仅收 innerShow，不 emit change', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.show({content: 'hi'})
    expect(inst.data.innerShow).toBe(true)
    inst.methods.hide()
    expect(inst.data.innerShow).toBe(false)
    expect(inst.events).toEqual([])
  })

  it('close：emit change {value:false}（defineExpose 对齐）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.show({content: 'hi'})
    inst.methods.close()
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: false}}])
  })

  it('show：仅拷贝 defined 键（serializable 分支）+ innerShow', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.show({})
    expect(inst.data.innerShow).toBe(true)
    expect(inst.data.title).toBe('')
    expect(inst.data.maskClosable).toBe(false)
  })

  it('show：_onShow/_onHide 函数入实例状态，popup 事件转发 + 一次性 onHide', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    const onShow = vi.fn()
    const onHide = vi.fn()
    inst.methods.show({_onShow: onShow, _onHide: onHide})
    inst.methods.onPopupShow()
    expect(onShow).toHaveBeenCalledTimes(1)
    expect(inst.eventsOf('show')).toHaveLength(1)

    inst.methods.onPopupHide()
    expect(onHide).toHaveBeenCalledTimes(1)
    expect(inst.eventsOf('hide')).toHaveLength(1)
    // 命令式钩子一次性：第二次 hide 不再调用
    inst.methods.onPopupHide()
    expect(onHide).toHaveBeenCalledTimes(1)

    // 未注册钩子时 onPopupShow/onPopupHide 不崩溃
    const bare = mountDef(comp.def)
    bare.attached()
    expect(() => {
      bare.methods.onPopupShow()
      bare.methods.onPopupHide()
    }).not.toThrow()
  })

  it('show 先于 attached：state 兜底分支不崩溃', () => {
    const inst = mountDef(comp.def)
    expect(() => inst.methods.show({title: 'T'})).not.toThrow()
    expect(inst.data.innerShow).toBe(true)
  })
})

describe('dialog 按钮点击（onClickBtn）', () => {
  function mountWithBtns(btns: Array<Record<string, unknown>>) {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.setData({btns, innerShow: true})
    return inst
  }

  it('无 handler：直接关闭（乐观更新 + change）', () => {
    const inst = mountWithBtns([{text: '确定'}])
    inst.methods.onClickBtn(tapEvent({index: 0}))
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: false}}])
  })

  it('handler 收到原始 btn；返回 false 阻断关闭', () => {
    const handler = vi.fn(() => false)
    const inst = mountWithBtns([{text: '确定', bold: true, handler}])
    inst.methods.onClickBtn(tapEvent({index: 0}))
    expect(handler).toHaveBeenCalledWith(inst.data.btns[0])
    expect(inst.data.innerShow).toBe(true)
    expect(inst.events).toEqual([])
  })

  it('handler 返回非 false：关闭', () => {
    const handler = vi.fn(() => undefined)
    const inst = mountWithBtns([{text: '确定', handler}])
    inst.methods.onClickBtn(tapEvent({index: 0}))
    expect(handler).toHaveBeenCalledTimes(1)
    expect(inst.data.innerShow).toBe(false)
  })

  it('loading / disabled 按钮：阻断', () => {
    const handler = vi.fn()
    const inst = mountWithBtns([
      {text: 'A', loading: true, handler},
      {text: 'B', disabled: true, handler},
    ])
    inst.methods.onClickBtn(tapEvent({index: 0}))
    inst.methods.onClickBtn(tapEvent({index: 1}))
    expect(handler).not.toHaveBeenCalled()
    expect(inst.data.innerShow).toBe(true)
  })

  it('越界 index：静默', () => {
    const inst = mountWithBtns([{text: 'A'}])
    expect(() => inst.methods.onClickBtn(tapEvent({index: 5}))).not.toThrow()
    expect(inst.data.innerShow).toBe(true)
  })

  it('onClose（closable 图标）走 close；noop 可调', () => {
    const inst = mountWithBtns([{text: 'A'}])
    inst.methods.onClose()
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')).toHaveLength(1)
    expect(() => inst.methods.noop()).not.toThrow()
  })
})

describe('dialog popup 桥接', () => {
  it('onPopupChange(true)：忽略；false：关闭 + change', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.show({content: 'hi'})
    inst.methods.onPopupChange({detail: {value: true}})
    expect(inst.data.innerShow).toBe(true)
    inst.methods.onPopupChange({detail: {value: false}})
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: false}}])
  })
})
