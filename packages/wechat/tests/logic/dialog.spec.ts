/**
 * dialog 纯逻辑测试：工厂 Promise 语义（Vant 惯例：确认 resolve / 取消 reject）
 * 与 icon 预设浅拷贝（对齐修复后的 Vue 版 succeed/failed）、按钮归一化。
 */
import {describe, it, expect, vi} from 'vitest'
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
})
