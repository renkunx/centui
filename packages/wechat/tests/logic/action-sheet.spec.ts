/**
 * action-sheet 纯逻辑测试：选项归一化与 cancel 语义、
 * create 工厂的 mounted/destroyed 幂等清理（对齐修复后的 Vue 版）。
 */
import {describe, it, expect, vi} from 'vitest'
import {
  normalizeInvalidIndex,
  isInvalidIndex,
  optionText,
} from '../../src/components/action-sheet/logic'
import {
  ActionSheetFactory,
  type ActionSheetCreateProps,
} from '../../src/components/action-sheet/factory'
import {loadComponent, mountDef, tapEvent} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/action-sheet/index'))

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

describe('action-sheet/logic', () => {
  it('normalizeInvalidIndex：-1/undefined 视为无禁用，数组过滤非整数值', () => {
    expect(normalizeInvalidIndex(-1)).toEqual([])
    expect(normalizeInvalidIndex(undefined)).toEqual([])
    expect(normalizeInvalidIndex(null)).toEqual([])
    expect(normalizeInvalidIndex(2)).toEqual([2])
    expect(normalizeInvalidIndex([0, 2, 4])).toEqual([0, 2, 4])
    expect(normalizeInvalidIndex([1.5, NaN, 3] as unknown as number[])).toEqual([3])
  })

  it('isInvalidIndex：单值与数组形式均阻断（Vue inArray 契约）', () => {
    expect(isInvalidIndex(2, normalizeInvalidIndex(2))).toBe(true)
    expect(isInvalidIndex(2, normalizeInvalidIndex([0, 2]))).toBe(true)
    expect(isInvalidIndex(1, normalizeInvalidIndex([0, 2]))).toBe(false)
  })

  it('optionText：text 优先、label 回退（Vue item.text || item.label）', () => {
    expect(optionText({text: 'A', label: 'B'})).toBe('A')
    expect(optionText({label: 'B'})).toBe('B')
    expect(optionText({})).toBe('')
    expect(optionText(undefined)).toBe('')
  })
})

describe('action-sheet 工厂（ActionSheetFactory.create）', () => {
  it('选中项 resolve {index, text}，onSelected 回调兼容，随后关闭', async () => {
    const comp = fakeComp()
    const onSelected = vi.fn()
    const promise = ActionSheetFactory.create(fakeContext(comp), {
      title: 'T',
      options: [{text: 'A'}, {label: 'B'}],
      onSelected,
    })

    expect(comp.shown).toHaveLength(1)
    expect(comp.shown[0].title).toBe('T')
    ;(comp.shown[0]._onSelected as (p: {index: number; item: unknown}) => void)({
      index: 1,
      item: {label: 'B'},
    })
    await expect(promise).resolves.toEqual({index: 1, text: 'B'})
    expect(onSelected).toHaveBeenCalledWith({label: 'B'})
    expect(comp.hideCount).toBe(1)
  })

  it('取消 resolve {cancel:true} 并触发 onCancel', async () => {
    const comp = fakeComp()
    const onCancel = vi.fn()
    const promise = ActionSheetFactory.create(fakeContext(comp), {onCancel})
    ;(comp.shown[0]._onCancel as () => void)()
    await expect(promise).resolves.toEqual({cancel: true})
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('create({value:false}) 后未 show 即 close：直接清理 settle cancel，不触发 onHide（mounted/destroyed 契约）', async () => {
    const comp = fakeComp()
    const onHide = vi.fn()
    const promise = ActionSheetFactory.create(fakeContext(comp), {value: false, onHide})

    // value:false → 仅登记配置（_deferred），不显示
    expect(comp.shown).toHaveLength(1)
    expect(comp.shown[0]._deferred).toBe(true)

    promise.close()
    await expect(promise).resolves.toEqual({cancel: true})
    expect(onHide).not.toHaveBeenCalled()
    expect(comp.hideCount).toBe(0)
  })

  it('close 幂等：已 destroyed 后再 close 不重复 settle', async () => {
    const comp = fakeComp()
    const promise = ActionSheetFactory.create(fakeContext(comp), {value: false})
    promise.close()
    await expect(promise).resolves.toEqual({cancel: true})
    promise.close()
    await expect(promise).resolves.toEqual({cancel: true})
  })

  it('已显示后 close → 组件 hide，_onHide 清理（close 幂等）', async () => {
    const comp = fakeComp()
    const promise = ActionSheetFactory.create(fakeContext(comp), {value: true})
    ;(comp.shown[0]._onShow as () => void)()
    promise.close()
    expect(comp.hideCount).toBe(1)

    // 组件 hide 回调 → 清理
    ;(comp.shown[0]._onHide as () => void)()
    promise.close()
    expect(comp.hideCount).toBe(1)
  })

  it('同一弹层组件重复 create：前一个未决 Promise 按 cancel 收敛', async () => {
    const comp = fakeComp()
    const first = ActionSheetFactory.create(fakeContext(comp), {title: 'first'})
    const second = ActionSheetFactory.create(fakeContext(comp), {title: 'second'})
    await expect(first).resolves.toEqual({cancel: true})
    ;(comp.shown[1]._onSelected as (p: {index: number; item: unknown}) => void)({
      index: 0,
      item: {text: 'A'},
    })
    await expect(second).resolves.toEqual({index: 0, text: 'A'})
  })

  it('组件缺失时 reject（含告警）', async () => {
    const context = {selectComponent: () => null} as unknown as WechatMiniprogram.Component.TrivialInstance
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(ActionSheetFactory.create(context, {})).rejects.toThrow('未找到')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('默认 cancelText 为空时透传 undefined（组件回退 locale），传入则透传', () => {
    const comp = fakeComp()
    ActionSheetFactory.create(fakeContext(comp), {})
    expect(comp.shown[0].cancelText).toBeUndefined()

    const comp2 = fakeComp()
    const props = {cancelText: '不开'} as ActionSheetCreateProps
    ActionSheetFactory.create(fakeContext(comp2), props)
    expect(comp2.shown[0].cancelText).toBe('不开')
  })
})

/**
 * 组件层（index.ts）：observers/attached 派生、一等 API show/hide、
 * popup 转发链路（change/show/hide/cancel/selected）与工厂钩子登记。
 */
describe('action-sheet 组件', () => {
  it('attached：初始 props 派生 innerShow/clickIndex/invalidList/cancelTextResolved', () => {
    const inst = mountDef(comp.def, {
      props: {show: true, defaultIndex: 1, invalidIndex: [0, 2]},
    })
    inst.attached()
    expect(inst.data.innerShow).toBe(true)
    expect(inst.data.clickIndex).toBe(1)
    expect(inst.data.invalidList).toEqual([0, 2])
    expect(inst.data.cancelTextResolved).toBe('取消') // 空文案回退 locale

    const custom = mountDef(comp.def, {
      props: {invalidIndex: 3, cancelText: '关闭'},
    })
    custom.attached()
    custom.attached() // __sheetState 已存在：幂等
    expect(custom.data.invalidList).toEqual([3])
    expect(custom.data.cancelTextResolved).toBe('关闭')
  })

  it('observers：show/defaultIndex/invalidIndex/cancelText 变更驱动内态', () => {
    const inst = mountDef(comp.def)
    inst.setData({show: true})
    expect(inst.data.innerShow).toBe(true)
    inst.setData({defaultIndex: 2})
    expect(inst.data.clickIndex).toBe(2)
    inst.setData({invalidIndex: 1})
    expect(inst.data.invalidList).toEqual([1])
    inst.setData({cancelText: ''})
    expect(inst.data.cancelTextResolved).toBe('取消')
    inst.setData({cancelText: '自定义'})
    expect(inst.data.cancelTextResolved).toBe('自定义')
  })

  it('show(options)：序列化字段入 data + 钩子登记 + 显示；_deferred 仅登记不显示', () => {
    const inst = mountDef(comp.def)
    const onShow = vi.fn()
    inst.methods.show.call(inst, {
      title: 'T',
      options: [{text: 'A'}],
      defaultIndex: 0,
      invalidIndex: 1,
      cancelText: '关',
      maxHeight: 300,
      _onShow: onShow,
    })
    expect(inst.data.innerShow).toBe(true)
    expect(inst.data.title).toBe('T')
    expect(inst.data.maxHeight).toBe(300)
    expect(onShow).toHaveBeenCalledTimes(1)

    // _deferred：登记配置但不显示、不触发 onShow
    const deferred = mountDef(comp.def)
    const onShow2 = vi.fn()
    deferred.methods.show.call(deferred, {_onShow: onShow2, _deferred: true})
    expect(deferred.data.innerShow).toBe(false)
    expect(onShow2).not.toHaveBeenCalled()

    // 无参 show：全键 undefined → 仅显示
    inst.methods.show.call(inst)
    expect(inst.data.innerShow).toBe(true)
  })

  it('hide()：innerShow 收起', () => {
    const inst = mountDef(comp.def)
    inst.methods.show.call(inst, {})
    inst.methods.hide.call(inst)
    expect(inst.data.innerShow).toBe(false)
  })

  it('onPopupChange：value=false 回流 hideSheet（change {value:false}）；value=true 忽略', () => {
    const inst = mountDef(comp.def)
    inst.methods.onPopupChange.call(inst, {detail: {value: true}})
    expect(inst.events).toEqual([])
    inst.methods.onPopupChange.call(inst, {detail: {value: false}})
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')[0].detail).toEqual({value: false})
  })

  it('onPopupShow/onPopupHide：show/hide 事件 + 工厂钩子；onPopupHide 后 onHide 注销', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    const onShow = vi.fn()
    const onHide = vi.fn()
    inst.methods.show.call(inst, {_onShow: onShow, _onHide: onHide})

    // show() 立即触发 onShow 钩子（index.ts：非 _deferred 即回调）
    expect(onShow).toHaveBeenCalledTimes(1)

    inst.methods.onPopupShow.call(inst)
    expect(inst.eventsOf('show')).toHaveLength(1)
    expect(onShow).toHaveBeenCalledTimes(2) // popup show 事件再触发一次

    inst.methods.onPopupHide.call(inst)
    expect(inst.eventsOf('hide')).toHaveLength(1)
    expect(onHide).toHaveBeenCalledTimes(1)
    expect(inst.data.innerShow).toBe(false) // hideSheet
    expect(inst.eventsOf('change')[0].detail).toEqual({value: false})

    // onHide 已注销：再次 hide 不重复回调
    inst.methods.onPopupHide.call(inst)
    expect(onHide).toHaveBeenCalledTimes(1)
  })

  it('onSelect：禁用位阻断；命中项 → clickIndex + selected 载荷 {item, index} + 钩子 + 关闭', () => {
    const inst = mountDef(comp.def, {props: {invalidIndex: [0]}})
    inst.attached()
    const onSelected = vi.fn()
    inst.methods.show.call(inst, {options: [{text: 'A'}, {text: 'B'}], _onSelected: onSelected})

    inst.methods.onSelect.call(inst, tapEvent({index: 0})) // 禁用位
    expect(inst.events).toEqual([])
    expect(inst.data.clickIndex).not.toBe(0)

    inst.methods.onSelect.call(inst, tapEvent({index: 1}))
    expect(inst.data.clickIndex).toBe(1)
    expect(onSelected).toHaveBeenCalledWith({index: 1, item: {text: 'B'}})
    expect(inst.eventsOf('selected')[0].detail).toEqual({item: {text: 'B'}, index: 1})
    expect(inst.data.innerShow).toBe(false)
  })

  it('onSelect：越界 index → item 兜底空对象；未登记钩子不崩溃', () => {
    const inst = mountDef(comp.def, {props: {options: [{text: 'A'}]}})
    inst.attached()
    expect(() => inst.methods.onSelect.call(inst, tapEvent({index: 9}))).not.toThrow()
    expect(inst.eventsOf('selected')[0].detail).toEqual({item: {}, index: 9})
    expect(inst.data.innerShow).toBe(false)
  })

  it('onCancel：cancel 事件 + 钩子 + 关闭', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    const onCancel = vi.fn()
    inst.methods.show.call(inst, {_onCancel: onCancel})
    inst.methods.onCancel.call(inst)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(inst.eventsOf('cancel')).toHaveLength(1)
    expect(inst.data.innerShow).toBe(false)
  })

  it('未 attached 时 popup 回调安全（__sheetState 缺省）', () => {
    const inst = mountDef(comp.def)
    expect(() => {
      inst.methods.onPopupShow.call(inst)
      inst.methods.onPopupHide.call(inst)
      inst.methods.onSelect.call(inst, tapEvent({index: 0}))
      inst.methods.onCancel.call(inst)
    }).not.toThrow()
    expect(inst.eventsOf('show')).toHaveLength(1)
    expect(inst.eventsOf('hide')).toHaveLength(1)
    expect(() => inst.methods.noop.call(inst)).not.toThrow()
  })
})
