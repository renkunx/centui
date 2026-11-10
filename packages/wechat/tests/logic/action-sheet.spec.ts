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
