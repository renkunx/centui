/**
 * textarea-item 逻辑层测试（对照 Vue 版 TextareaItem.vue 行为清单）：
 * 1. v-model：value→current 同步，输入/变更派发 input 与 change
 * 2. formation 注入格式化（setFormation，wxml 无法传函数的平台桥）
 * 3. __refresh 派生：rows→height 估算、maxHeight、maxLength→nativeMaxlength、
 *    rootClass（is-disabled/is-error/is-solid）、showRight
 * 4. focus/blur：blur 延迟 100ms 收起（对齐 Vue onBlur）；clear 清空并回焦
 */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/textarea-item/index'))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function mountItem(props: Record<string, unknown> = {}) {
  const inst = mountDef(comp.def, {props})
  inst.attached()
  return inst
}

describe('textarea-item v-model', () => {
  it('attached：初始 value 写入 current', () => {
    const inst = mountItem({value: '初始'})
    expect(inst.data.current).toBe('初始')
    expect(inst.data.isInputEmpty).toBe(false)
  })

  it('onInput：派发 input {value}，current 同步', () => {
    const inst = mountItem()
    inst.methods.onInput.call(inst, {detail: {value: 'abc'}})
    expect(inst.data.current).toBe('abc')
    expect(inst.eventsOf('input')).toEqual([{name: 'input', detail: {value: 'abc'}}])
  })

  it('current 变更派发 change {value}（update:modelValue 等价）', () => {
    const inst = mountItem()
    inst.methods.onInput.call(inst, {detail: {value: 'x'}})
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: 'x'}}])
  })

  it('受控回写：外部 value 覆盖 current 并触发 change', () => {
    const inst = mountItem()
    inst.setData({value: '外部值'})
    expect(inst.data.current).toBe('外部值')
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: '外部值'}}])
  })

  it('getValue 返回当前值', () => {
    const inst = mountItem({value: 'v'})
    expect(inst.methods.getValue.call(inst)).toBe('v')
  })
})

describe('textarea-item formation', () => {
  it('setFormation 注入后 onInput 走格式化', () => {
    const inst = mountItem()
    inst.methods.setFormation.call(inst, () => ({value: 'FORMATTED'}))
    inst.methods.onInput.call(inst, {detail: {value: 'raw'}})
    expect(inst.data.current).toBe('FORMATTED')
    expect(inst.eventsOf('input')[0].detail).toEqual({value: 'FORMATTED'})
  })

  it('formation 返回空：原样透传', () => {
    const inst = mountItem()
    inst.methods.setFormation.call(inst, () => null)
    inst.methods.onInput.call(inst, {detail: {value: 'raw'}})
    expect(inst.data.current).toBe('raw')
  })

  it('formation 返回 {value: ""}：结果为空串（与 Vue 一致，result 真值即采用）', () => {
    const inst = mountItem()
    inst.methods.setFormation.call(inst, () => ({value: ''}))
    inst.methods.onInput.call(inst, {detail: {value: 'raw'}})
    expect(inst.data.current).toBe('')
  })
})

describe('textarea-item __refresh 派生', () => {
  it('rows → height 内联（line-height 1.4 估算）；autosize 时为空', () => {
    const inst = mountItem({rows: 4})
    expect(inst.data.heightStyle).toBe('height: 5.6em;')

    const auto = mountItem({autosize: true})
    expect(auto.data.heightStyle).toBe('')
  })

  it('非法 rows 回退 3', () => {
    const inst = mountItem({rows: 0})
    expect(inst.data.heightStyle).toBe('height: 4.2em;')
  })

  it('maxHeight → max-height 内联；空串不限', () => {
    const inst = mountItem({maxHeight: '200rpx'})
    expect(inst.data.maxHeightStyle).toBe('max-height: 200rpx;')

    const none = mountItem()
    expect(none.data.maxHeightStyle).toBe('')
  })

  it('maxLength → nativeMaxlength；空串为 -1 不限', () => {
    const inst = mountItem({maxLength: 10})
    expect(inst.data.nativeMaxlength).toBe(10)

    const none = mountItem({maxLength: ''})
    expect(none.data.nativeMaxlength).toBe(-1)
  })

  it('rootClass：disabled/error/solid 修饰', () => {
    const plain = mountItem()
    expect(plain.data.rootClass).toBe('cu-field-item cu-textarea-item is-solid')

    const full = mountItem({disabled: true, error: '必填', solid: false})
    expect(full.data.rootClass).toBe('cu-field-item cu-textarea-item is-disabled is-error')
    expect(full.data.isDisabled).toBe(true)
    expect(full.data.errorInfo).toBe('必填')
  })

  it('showRight：clearable 或 rightFilled 驱动', () => {
    const inst = mountItem({clearable: true})
    expect(inst.data.showRight).toBe(true)
  })
})

describe('textarea-item focus / blur / clear', () => {
  it('focus/blur 方法控制 focusAttr', () => {
    const inst = mountItem()
    inst.methods.focus.call(inst)
    expect(inst.data.focusAttr).toBe(true)
    inst.methods.blur.call(inst)
    expect(inst.data.focusAttr).toBe(false)
  })

  it('onFocus 立即置焦；onBlur 延迟 100ms 收起（对齐 Vue）', () => {
    const inst = mountItem()
    inst.methods.onFocus.call(inst)
    expect(inst.data.isInputFocus).toBe(true)

    inst.methods.onBlur.call(inst)
    expect(inst.data.isInputFocus).toBe(true)
    vi.advanceTimersByTime(100)
    expect(inst.data.isInputFocus).toBe(false)
    expect(inst.eventsOf('blur')).toHaveLength(1)
    expect(inst.eventsOf('focus')).toHaveLength(1)
  })

  it('onClearTap：清空 current 并回焦', () => {
    const inst = mountItem({value: '内容', clearable: true})
    inst.methods.onClearTap.call(inst)
    expect(inst.data.current).toBe('')
    expect(inst.data.focusAttr).toBe(true)
  })
})

describe('textarea-item 生命周期', () => {
  it('name 缺省：VITEST 环境 randomId 返回空串（契约），不崩溃', () => {
    const inst = mountItem()
    expect((inst as unknown as {__name: string}).__name).toBe('')
  })

  it('传入 name 保留', () => {
    const inst = mountItem({name: 'remark'})
    expect((inst as unknown as {__name: string}).__name).toBe('remark')
  })

  it('detached 清理定时器（blur 延迟回调不再触发）', () => {
    const inst = mountItem()
    inst.methods.onBlur.call(inst)
    inst.detached()
    vi.advanceTimersByTime(200)
    expect(inst.eventsOf('blur')).toHaveLength(0)
  })
})
