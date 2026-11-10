/**
 * input-item 格式化管线测试：phone/bankCard/money/digit/text 全类型 +
 * stripSeparators / subValue / maxlength，逐一对照 Vue 版 InputItem.vue
 * formateValue/subValue 与 @centui/core format.ts。
 * 另含组件层（index.ts）：observers 双向绑定、派生量 __refresh、原生 input 事件、
 * 虚拟键盘事件、relations 广播、生命周期（attached/ready/detached）与 env 探测。
 */
import {describe, it, expect, vi, afterEach} from 'vitest'
import {
  emittedValue,
  formatInputValue,
  formatValueByGapRule,
  formatValueByGapStep,
  inputMaxlength,
  isAddOf,
  isFormativeType,
  randomId,
  stripSeparators,
  subValue,
  trimValue,
} from '../../src/components/input-item/logic'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/input-item/index'))

afterEach(() => {
  vi.useRealTimers()
})

const fmt = (
  curValue: string,
  opts: Partial<Parameters<typeof formatInputValue>[1]> = {},
) =>
  formatInputValue(curValue, {
    type: 'text',
    isFormative: false,
    maxlength: '',
    name: 'test',
    oldValue: '',
    ...opts,
  })

describe('core 同步实现：formatValueByGapRule / GapStep / trimValue', () => {
  it('phone 分组规则 3|4|4', () => {
    expect(formatValueByGapRule('3|4|4', '13800138000').value).toBe('138 0013 8000')
  })

  it('超长部分剔除（规则末位截断）', () => {
    expect(formatValueByGapRule('3|4|4', '1380013800012345').value).toBe('138 0013 8000')
  })

  it('bankCard 步长 4 左分组', () => {
    expect(formatValueByGapStep(4, '6222020200112233', ' ', 'left').value).toBe(
      '6222 0202 0011 2233',
    )
  })

  it('money 步长 3 右分组（千分位）', () => {
    expect(formatValueByGapStep(3, '1234567', ',', 'right').value).toBe('1,234,567')
  })

  it('trimValue 按字面量剔除间隔符（含正则特殊字符）', () => {
    expect(trimValue('1,234,567', ',')).toBe('1234567')
    expect(trimValue('1.2.3', '.')).toBe('123')
    expect(trimValue('a*b', '*')).toBe('ab')
  })
})

describe('input-item/logic stripSeparators（修复后语义）', () => {
  it('剥离空白与千分位逗号', () => {
    expect(stripSeparators('1 23,456')).toBe('123456')
    expect(stripSeparators('  a  ')).toBe('a')
    expect(stripSeparators('')).toBe('')
  })
})

describe('input-item/logic 类型判定与 maxlength', () => {
  it('isFormativeType：isFormative 显式开启或类型自带格式化', () => {
    expect(isFormativeType('bankCard', false)).toBe(true)
    expect(isFormativeType('phone', false)).toBe(true)
    expect(isFormativeType('money', false)).toBe(true)
    expect(isFormativeType('digit', false)).toBe(true)
    expect(isFormativeType('text', false)).toBe(false)
    expect(isFormativeType('text', true)).toBe(true)
  })

  it('inputMaxlength：phone 恒 11', () => {
    expect(inputMaxlength('phone', '')).toBe(11)
    expect(inputMaxlength('phone', 20)).toBe(11)
    expect(inputMaxlength('text', '')).toBe('')
    expect(inputMaxlength('text', 5)).toBe(5)
  })

  it("subValue：'' / undefined 不截断", () => {
    expect(subValue('123456', 11)).toBe('123456')
    expect(subValue('12345678901', 11)).toBe('12345678901')
    expect(subValue('123456789012', 11)).toBe('12345678901')
    expect(subValue('123456', '')).toBe('123456')
    expect(subValue('123456', undefined)).toBe('123456')
  })

  it('isAddOf：长度变短为删除', () => {
    expect(isAddOf('1234', '123')).toBe(-1)
    expect(isAddOf('123', '1234')).toBe(1)
  })
})

describe('input-item/logic 各类型格式化管线', () => {
  it('bankCard：去非数字 → 截断 → 4 位左分组', () => {
    expect(fmt('6222020200112233', {type: 'bankCard'}).value).toBe('6222 0202 0011 2233')
    expect(fmt('6222-0202-0011-2233', {type: 'bankCard'}).value).toBe('6222 0202 0011 2233')
    expect(fmt('62220202001122330000', {type: 'bankCard', maxlength: 16}).value).toBe(
      '6222 0202 0011 2233',
    )
  })

  it('phone：去非数字 → maxlength 11 → 3|4|4', () => {
    expect(fmt('13800138000', {type: 'phone'}).value).toBe('138 0013 8000')
    expect(fmt('1380013800012345', {type: 'phone'}).value).toBe('138 0013 8000')
  })

  it('money：千分位 + 小数位保留', () => {
    expect(fmt('1234567.89', {type: 'money'}).value).toBe('1,234,567.89')
    expect(fmt('1000', {type: 'money'}).value).toBe('1,000')
  })

  it("money：非数字剔除；多余小数点截断至首个小数段（与 Vue split('.')[1] 一致）", () => {
    expect(fmt('abc123', {type: 'money'}).value).toBe('123')
    expect(fmt('1.2.3', {type: 'money'}).value).toBe('1.2')
  })

  it('digit：去非数字并截断', () => {
    expect(fmt('12a34', {type: 'digit'}).value).toBe('1234')
    expect(fmt('123456', {type: 'digit', maxlength: 4}).value).toBe('1234')
  })

  it('text（非 formative）直通不格式化', () => {
    expect(fmt('1a2 b', {type: 'text'}).value).toBe('1a2 b')
  })

  it('formative 开启但类型为 text：无默认格式化分支，值保持（对齐 Vue switch 无 case）', () => {
    expect(fmt('1a2', {type: 'text', isFormative: true}).value).toBe('1a2')
  })

  it("空值直通（curValue === '' 短路）", () => {
    expect(fmt('', {type: 'bankCard'}).value).toBe('')
  })

  it('自定义 formation 优先于默认格式化', () => {
    const formation = (name: string | number, curValue: string, curPos: number) =>
      curValue === 'X' ? {value: 'Y', range: curPos + 1} : undefined
    expect(fmt('X', {type: 'bankCard', formation}).value).toBe('Y')
    expect(fmt('12345678', {type: 'bankCard', formation}).value).toBe('1234 5678')
  })

  it('删除方向（isAdd -1）时 bankCard 光标修正不改变值', () => {
    const r = fmt('1234 567', {type: 'bankCard', oldValue: '1234 5678'})
    expect(r.value).toBe('1234 567')
  })
})

describe('input-item/logic 发射值与 randomId', () => {
  it('emittedValue：格式化类型剥离分隔符', () => {
    expect(emittedValue('138 0013 8000', true)).toBe('13800138000')
    expect(emittedValue('1,234,567.89', true)).toBe('1234567.89')
    expect(emittedValue('1a2', false)).toBe('1a2')
  })

  it('randomId：测试环境空串（对齐 core 契约），运行时带 prefix', () => {
    expect(randomId('input-item')).toBe('')
    const proc = process as unknown as {env: Record<string, string | undefined>}
    const prev = proc.env.VITEST
    delete proc.env.VITEST
    try {
      expect(randomId('input-item')).toMatch(/^input-item-\d+$/)
    } finally {
      proc.env.VITEST = prev
    }
  })

  it('randomId：无 process 全局时直接生成（proc falsy 分支）', () => {
    const g = globalThis as any
    const desc = Object.getOwnPropertyDescriptor(g, 'process')
    const prev = g.process
    try {
      delete g.process
      expect(randomId('input-item')).toMatch(/^input-item-\d+$/)
    } finally {
      if (desc?.get) {
        Object.defineProperty(g, 'process', desc)
      } else {
        g.process = prev
      }
    }
  })

  it("formatValueByGapStep：空值直通（value.length === 0 分支，bankCard 全非数字剔除后）", () => {
    expect(fmt('abc', {type: 'bankCard'}).value).toBe('')
  })

  it('money 加方向插入千分位时光标 +1（isAdd=1 且长度差 -2）', () => {
    const r = fmt('1000', {type: 'money', oldValue: '999', curPos: 4})
    expect(r.value).toBe('1,000')
    expect(r.range).toBe(5)
  })

  it('money 删方向千分位回退时光标归 0（isAdd=-1 且长度差 2）', () => {
    const r = fmt('100', {type: 'money', oldValue: '1,000', curPos: 0})
    expect(r.value).toBe('100')
    expect(r.range).toBe(0)
  })

  it("formatValueByGapRule：光标落在分组边界 → adapt 修正（range + isAdd）", () => {
    // rule [3,7,11]：range 4 === rule[0]+1+0 → adapt 1*1 → 5
    expect(formatValueByGapRule('3|4|4', '1380', ' ', 4, 1).range).toBe(5)
    // 删除方向 adapt -1：range 4 → 3
    expect(formatValueByGapRule('3|4|4', '138', ' ', 4, -1).range).toBe(3)
    expect(formatValueByGapRule('3|4|4', '1380', ' ', 0, 1).range).toBe(0)
  })

  it('formatValueByGapRule：空值 → 空数组直通（value falsy 分支）', () => {
    expect(formatValueByGapRule('3|4|4', '', ' ', 0, 1)).toEqual({value: '', range: 0})
  })

  it('formatValueByGapStep：gap/direction 缺省（空格 right 分组），range 未传不产出', () => {
    const r = formatValueByGapStep(3, '1234567')
    expect(r.value).toBe('1 234 567')
    expect(r.range).toBeUndefined()
  })

  it('formatValueByGapStep：删方向长度差非 2 / range 缺省 / range 修正后仍 > 0', () => {
    // oldValue 3 → showValue 2：差 1 ≠ 2 → range 不修正
    expect(formatValueByGapStep(3, '10', ',', 'right', 0, -1, '100').range).toBe(0)
    // range undefined → _range undefined → 守卫短路
    expect(formatValueByGapStep(3, '10', ',', 'right', undefined, -1, '100').range).toBeUndefined()
    // 差 2 修正后 _range = 4 > 0 → 保持
    expect(formatValueByGapStep(3, '100', ',', 'right', 5, -1, '10000').range).toBe(4)
  })

  it('trimValue：undefined 入参 → 空串（typeof 守卫）', () => {
    expect(trimValue(undefined)).toBe('')
  })
})

/* -------------------------------------------------------------------------
 * 组件层（index.ts）
 * ---------------------------------------------------------------------- */

describe('input-item 组件：生命周期与 env 探测', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('attached：inputEnv 按 wx.getDeviceInfo().platform 推导', () => {
    const ios = mountDef(comp.def, {platform: 'ios'})
    ios.attached()
    expect(ios.data.inputEnv).toBe('is-ios')
    const android = mountDef(comp.def, {platform: 'android'})
    android.attached()
    expect(android.data.inputEnv).toBe('is-android')
    const devtools = mountDef(comp.def, {platform: 'devtools'})
    devtools.attached()
    expect(devtools.data.inputEnv).toBe('is-browser')
    const blank = mountDef(comp.def, {platform: ''})
    blank.attached()
    expect(blank.data.inputEnv).toBe('is-browser')
  })

  it('attached：getDeviceInfo 抛错 → is-browser（catch 分支）', () => {
    const g = globalThis as any
    const prev = g.wx.getDeviceInfo
    g.wx.getDeviceInfo = () => {
      throw new Error('boom')
    }
    try {
      const inst = mountDef(comp.def)
      inst.attached()
      expect(inst.data.inputEnv).toBe('is-browser')
    } finally {
      g.wx.getDeviceInfo = prev
    }
  })

  it('attached：__name 取 name 属性；phone 初始值截断 + 格式化 + change 载荷', () => {
    const inst = mountDef(comp.def, {
      props: {name: 'phone1', type: 'phone', value: '138001380001234'},
    })
    inst.attached()
    expect(inst.data.inputValue).toBe('138 0013 8000')
    expect(inst.data.inputText).toBe('138 0013 8000')
    // emitted（剥离后 11 位）!== property value（15 位）→ change 外发
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {name: 'phone1', value: '13800138000'}},
    ])
  })

  it('attached：未命名 → randomId 兜底（测试环境空串）；maxlength 截断', () => {
    const inst = mountDef(comp.def, {props: {value: 'abcdef', maxlength: 3}})
    inst.attached()
    expect(inst.data.inputValue).toBe('abc')
    expect(inst.data.inputEnv).toBe('is-browser')
  })

  it('detached：清理挂起 blur 定时器（卸载后回调不触发）', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {props: {name: 'n1'}})
    inst.attached()
    inst.methods.onFocus.call(inst)
    inst.methods.onBlur.call(inst)
    inst.detached()
    vi.advanceTimersByTime(200)
    expect(inst.eventsOf('blur')).toEqual([])
  })
})

describe('input-item 组件：ready 插槽探测与 relations', () => {
  it('ready：空插槽回写（左空/右有/error 空/brief 空）+ 探测后重算派生量', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-field-item-left': {height: 0},
        '.cu-field-item-right': {height: 40},
        '.cu-input-item-msg': {height: 0},
        '.cu-input-item-brief': {height: 0},
      },
    })
    inst.attached()
    inst.ready()
    expect(inst.data.showLeft).toBe(false)
    expect(inst.data.rightFilled).toBe(true)
    expect(inst.data.errorFilled).toBe(false)
    expect(inst.data.briefFilled).toBe(false)
  })

  it('ready：部分插槽非空 → 仅回写空插槽', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-field-item-left': {height: 10},
        '.cu-field-item-right': {height: 0},
        '.cu-input-item-msg': {height: 10},
        '.cu-input-item-brief': {height: 10},
      },
    })
    inst.attached()
    inst.ready()
    expect(inst.data.showLeft).toBe(true)
    expect(inst.data.rightFilled).toBe(false)
    expect(inst.data.errorFilled).toBe(true)
    expect(inst.data.briefFilled).toBe(true)
  })

  it('ready：right 探针缺失且其余插槽非空 → patch 为空不 setData', () => {
    const inst = mountDef(comp.def, {
      rects: {
        '.cu-field-item-left': {height: 10},
        '.cu-input-item-msg': {height: 10},
        '.cu-input-item-brief': {height: 10},
      },
    })
    inst.attached()
    inst.ready()
    // right 探针缺失 → rightFilled 不回写（保持默认 true），patch 空
    expect(inst.data.rightFilled).toBe(true)
    expect(inst.data.errorFilled).toBe(true)
    expect(inst.data.briefFilled).toBe(true)
    expect(inst.data.showLeft).toBe(true)
  })

  it('ready：exec 无结果（!rects 防御分支）→ 直接返回', () => {
    const patches: Array<Record<string, unknown>> = []
    comp.def.lifetimes!.ready!.call({
      createSelectorQuery: () => ({
        select: () => ({boundingClientRect() { /* 注册 */ }}),
        exec(cb: (res: unknown) => void) {
          cb(null)
        },
      }),
      setData: (patch: Record<string, unknown>) => {
        patches.push(patch)
      },
      __refresh() { /* spy */ },
    } as never)
    expect(patches).toEqual([])
  })

  it('relations linked：cu-field 登记推送 disabled（含 parent.data 缺失兜底）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    const rel = comp.def.relations!['../field/index']
    rel.linked.call(inst, {data: {disabled: true}})
    expect(inst.data.fieldDisabled).toBe(true)
    rel.linked.call(inst, {data: {disabled: false}})
    expect(inst.data.fieldDisabled).toBe(false)
    rel.linked.call(inst, {} as never) // parent.data undefined → ?? {} 分支
    expect(inst.data.fieldDisabled).toBe(false)
    inst.methods.receiveFieldDisabled.call(inst, 1 as unknown as boolean)
    expect(inst.data.fieldDisabled).toBe(true)
    inst.methods.receiveFieldDisabled.call(inst, false)
    expect(inst.data.fieldDisabled).toBe(false)
  })
})

describe('input-item 组件：observers 与派生量', () => {
  it('value observer：外部回写 → 截断 + 格式化（two-way 受控回写）', () => {
    const inst = mountDef(comp.def, {props: {type: 'phone'}})
    inst.attached()
    inst.setData({value: '139000011112222'})
    expect(inst.data.inputValue).toBe('139 0000 1111')
  })

  it('value observer：与剥离值相同的回写被过滤（不重格式化不发事件）', () => {
    const inst = mountDef(comp.def, {props: {type: 'phone'}})
    inst.attached()
    expect(inst.eventsOf('change')).toEqual([])
    inst.setData({value: '13800138000'})
    expect(inst.data.inputValue).toBe('138 0013 8000')
    expect(inst.eventsOf('change')).toEqual([])
  })

  it('value observer：与当前剥离值一致的回写被过滤（onInput 后受控回写不重格式化）', () => {
    const inst = mountDef(comp.def, {props: {type: 'phone', name: 'p'}})
    inst.attached()
    inst.methods.onInput.call(inst, {detail: {value: '13900001111', cursor: 11}})
    expect(inst.data.inputValue).toBe('139 0000 1111')
    const changes = inst.eventsOf('change').length
    inst.setData({value: '13900001111'})
    expect(inst.data.inputValue).toBe('139 0000 1111') // 未重格式化
    expect(inst.eventsOf('change')).toHaveLength(changes) // 无新事件
  })

  it('value observer：null 值按空串处理（?? 分支）', () => {
    const inst = mountDef(comp.def, {props: {value: 'abc'}})
    inst.attached()
    inst.setData({value: null})
    expect(inst.data.inputValue).toBe('')
  })

  it('attached：value 属性为 null → 按空串初始化（?? 分支）', () => {
    const inst = mountDef(comp.def, {props: {value: null}})
    inst.attached()
    expect(inst.data.inputValue).toBe('')
  })

  it('previewType observer：isPreview 派生；itemType 优先取 previewType', () => {
    const inst = mountDef(comp.def, {
      props: {type: 'text', previewType: 'money', value: '1234567'},
    })
    inst.attached()
    expect(inst.data.isPreview).toBe(true)
    expect(inst.data.itemType).toBe('money')
    expect(inst.data.inputValue).toBe('1,234,567')
    inst.setData({previewType: ''})
    expect(inst.data.isPreview).toBe(false)
    expect(inst.data.itemType).toBe('text')
  })

  it("__itemType：type/previewType 均空回退 'text'", () => {
    const inst = mountDef(comp.def, {props: {type: ''}})
    inst.attached()
    expect(inst.data.itemType).toBe('text')
    expect(inst.data.inputType).toBe('text')
  })

  it('__refresh：inputType 映射（bankCard/phone/digit→number，money/password→text）', () => {
    const cases: Array<[string, string, boolean]> = [
      ['bankCard', 'number', false],
      ['phone', 'number', false],
      ['digit', 'number', false],
      ['money', 'text', false],
      ['password', 'text', true],
      ['text', 'text', false],
    ]
    for (const [type, inputType, pwd] of cases) {
      const inst = mountDef(comp.def, {props: {type}})
      inst.attached()
      expect(inst.data.inputType).toBe(inputType)
      expect(inst.data.inputPassword).toBe(pwd)
    }
  })

  it('nativeMaxlength：formative -1；非 formative 取 Number(maxlength)，空值 -1', () => {
    const formative = mountDef(comp.def, {props: {type: 'phone'}})
    formative.attached()
    expect(formative.data.nativeMaxlength).toBe(-1)

    const plain = mountDef(comp.def, {props: {maxlength: 5}})
    plain.attached()
    expect(plain.data.nativeMaxlength).toBe(5)
    plain.setData({maxlength: null})
    expect(plain.data.nativeMaxlength).toBe(-1)
    plain.setData({maxlength: undefined})
    expect(plain.data.nativeMaxlength).toBe(-1)
    plain.setData({maxlength: ''})
    expect(plain.data.nativeMaxlength).toBe(-1)
    plain.setData({maxlength: 8})
    expect(plain.data.nativeMaxlength).toBe(8)

    const forced = mountDef(comp.def, {props: {isFormative: true}})
    forced.attached()
    expect(forced.data.nativeMaxlength).toBe(-1)
  })

  it('inputPlaceholder：isTitleLatent 激活态置空；失焦复位 focusAttr', () => {
    const inst = mountDef(comp.def, {props: {isTitleLatent: true, placeholder: '请输入'}})
    inst.attached()
    expect(inst.data.inputPlaceholder).toBe('请输入') // 未激活
    inst.setData({isInputFocus: true})
    expect(inst.data.inputPlaceholder).toBe('') // 激活 → 空
    inst.setData({isTitleLatent: false})
    expect(inst.data.inputPlaceholder).toBe('请输入')
    inst.setData({isInputFocus: false})
    expect(inst.data.focusAttr).toBe(false) // observer !val 分支复位
  })

  it('rootClass：有值激活 + 错误/金额/对齐/尺寸/inputEnv 修饰符', () => {
    const inst = mountDef(comp.def, {
      props: {
        value: 'v',
        isHighlight: true,
        isAmount: true,
        clearable: true,
        align: 'right',
        size: 'large',
        error: '必填',
      },
    })
    inst.attached()
    const cls = inst.data.rootClass.split(' ')
    for (const c of [
      'cu-input-item',
      'is-highlight',
      'is-active',
      'is-error',
      'is-amount',
      'is-clear',
      'is-solid',
      'right',
      'large',
      'is-browser',
    ]) {
      expect(cls).toContain(c)
    }
    expect(cls).not.toContain('is-disabled')
    expect(cls).not.toContain('with-brief') // hasInputError 时 brief 类让位
    expect(inst.data.showMsg).toBe(true)
    expect(inst.data.showBrief).toBe(false)
    expect(inst.data.showRight).toBe(true) // showClear 兜底
  })

  it('rootClass：disabled（prop / field 广播）与 readonly 收敛', () => {
    const inst = mountDef(comp.def, {props: {disabled: true, clearable: true}})
    inst.attached()
    expect(inst.data.isDisabled).toBe(true)
    expect(inst.data.showClear).toBe(false)
    expect(inst.data.rootClass).toContain('is-disabled')

    inst.setData({disabled: false, readonly: true})
    expect(inst.data.isDisabled).toBe(false)
    expect(inst.data.showClear).toBe(false) // readonly 拦截

    inst.setData({readonly: false})
    expect(inst.data.showClear).toBe(true)
    inst.methods.receiveFieldDisabled.call(inst, true)
    expect(inst.data.isDisabled).toBe(true)
  })

  it('rootClass：brief 有内容且无错误 → with-brief；isTitleLatent 顶掉 is-solid', () => {
    const inst = mountDef(comp.def, {
      props: {brief: '说明', isTitleLatent: true},
      rects: {'.cu-input-item-msg': {height: 0}}, // error 插槽空 → errorFilled=false
    })
    inst.attached()
    inst.ready()
    expect(inst.data.errorFilled).toBe(false)
    const cls = inst.data.rootClass.split(' ')
    expect(cls).toContain('with-brief')
    expect(cls).toContain('is-title-latent')
    expect(cls).not.toContain('is-solid')
    expect(cls).not.toContain('is-error')
    expect(inst.data.showBrief).toBe(true)
  })

  it('showRight：rightFilled=false 且不可清除 → 隐藏右区', () => {
    const inst = mountDef(comp.def, {rects: {'.cu-field-item-right': {height: 0}}})
    inst.attached()
    inst.ready()
    expect(inst.data.rightFilled).toBe(false)
    expect(inst.data.showRight).toBe(false)
    inst.setData({clearable: true})
    expect(inst.data.showRight).toBe(true) // showClear 兜底
  })

  it('showChildren：虚拟键盘（无外部 vm）兜底为 true；传 vm 且插槽全空 → false', () => {
    const withVm = mountDef(comp.def, {
      props: {isVirtualKeyboard: true, virtualKeyboardVm: 'vm'},
      rects: {'.cu-input-item-msg': {height: 0}, '.cu-input-item-brief': {height: 0}},
    })
    withVm.attached()
    withVm.ready()
    expect(withVm.data.showChildren).toBe(false)

    const noVm = mountDef(comp.def, {
      props: {isVirtualKeyboard: true},
      rects: {'.cu-input-item-msg': {height: 0}, '.cu-input-item-brief': {height: 0}},
    })
    noVm.attached()
    noVm.ready()
    expect(noVm.data.showChildren).toBe(true)
  })

  it('setFormation：注入自定义格式化（formation 优先），置空回落默认管线', () => {
    const inst = mountDef(comp.def, {props: {type: 'bankCard', name: 'card'}})
    inst.attached()
    inst.methods.setFormation.call(inst, (name, curValue, curPos) => ({
      value: `[${name}:${curValue}]`,
      range: curPos,
    }))
    inst.methods.onInput.call(inst, {detail: {value: '123', cursor: 3}})
    expect(inst.data.inputValue).toBe('[card:123]')

    // formation 返回 undefined → 回落默认格式化
    inst.methods.setFormation.call(inst, () => undefined)
    inst.methods.onInput.call(inst, {detail: {value: '1234', cursor: 4}})
    expect(inst.data.inputValue).toBe('1234')

    // formation 置空（?? null 分支）→ 默认管线
    inst.methods.setFormation.call(inst, null)
    inst.methods.onInput.call(inst, {detail: {value: '12345', cursor: 5}})
    expect(inst.data.inputValue).toBe('1234 5')
  })

  it('未 attached 直接输入：__name 缺省（?? 兜底空串）', () => {
    const inst = mountDef(comp.def)
    inst.methods.onInput.call(inst, {detail: {value: 'x'}})
    expect(inst.eventsOf('change')[0].detail).toEqual({name: '', value: 'x'})
  })

  it('未 attached 的 focus/blur/confirm：__name 缺省（?? 兜底空串）；__formateValue 默认 curPos', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def)
    inst.methods.onFocus.call(inst)
    expect(inst.eventsOf('focus')[0].detail).toEqual({name: ''})
    inst.methods.onBlur.call(inst)
    inst.methods.onConfirm.call(inst)
    inst.methods.onKeyboardConfirm.call(inst)
    expect(inst.eventsOf('confirm')).toEqual([
      {name: 'confirm', detail: {name: '', value: ''}},
      {name: 'confirm', detail: {name: '', value: ''}},
    ])
    vi.advanceTimersByTime(100)
    expect(inst.eventsOf('blur')[0].detail).toEqual({name: ''})
    // __formateValue 省略 curPos → 默认 0（default param 分支）
    expect(inst.methods.__formateValue.call(inst, 'abc').range).toBe(0)
  })
})

describe('input-item 组件：原生 input 事件', () => {
  it('onInput：格式化类型按 cursor 格式化并回写', () => {
    const inst = mountDef(comp.def, {props: {type: 'bankCard', name: 'card'}})
    inst.attached()
    inst.methods.onInput.call(inst, {detail: {value: '6222020200112233', cursor: 16}})
    expect(inst.data.inputValue).toBe('6222 0202 0011 2233')
    expect(inst.eventsOf('change')[0].detail).toEqual({
      name: 'card',
      value: '6222020200112233',
    })
  })

  it('onInput：非格式化类型直通（cursor 缺省 0）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.onInput.call(inst, {detail: {value: 'a1'}})
    expect(inst.data.inputValue).toBe('a1')
  })

  it('onInput：IME 组合期仅同步原文不格式化；compositionend 补一次格式化', () => {
    const inst = mountDef(comp.def, {props: {type: 'bankCard'}})
    inst.attached()
    inst.methods.onCompositionStart.call(inst)
    inst.methods.onInput.call(inst, {detail: {value: '622202'}})
    expect(inst.data.inputValue).toBe('622202')
    inst.methods.onCompositionEnd.call(inst, {detail: {value: '6222020200112233'}})
    expect(inst.data.inputValue).toBe('6222 0202 0011 2233')
  })

  it('onFocus/onBlur：focus 立即派发；blur 延迟 100ms', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {props: {name: 'n1'}})
    inst.attached()
    inst.methods.onFocus.call(inst)
    expect(inst.data.isInputFocus).toBe(true)
    expect(inst.data.focusAttr).toBe(true)
    expect(inst.eventsOf('focus')).toEqual([{name: 'focus', detail: {name: 'n1'}}])
    inst.methods.onBlur.call(inst)
    expect(inst.data.isInputFocus).toBe(true) // 未到时
    vi.advanceTimersByTime(100)
    expect(inst.data.isInputFocus).toBe(false)
    expect(inst.eventsOf('blur')).toEqual([{name: 'blur', detail: {name: 'n1'}}])
  })

  it('onConfirm：confirm {name, value}；getValue 返回当前格式化值', () => {
    const inst = mountDef(comp.def, {props: {name: 'n2', value: 'v1'}})
    inst.attached()
    expect(inst.methods.getValue.call(inst)).toBe('v1')
    inst.methods.onConfirm.call(inst)
    expect(inst.eventsOf('confirm')).toEqual([
      {name: 'confirm', detail: {name: 'n2', value: 'v1'}},
    ])
  })
})

describe('input-item 组件：公开方法与清除/预览', () => {
  it('focus()/blur()：普通模式切 focusAttr；虚拟键盘模式切 isInputFocus', () => {
    const plain = mountDef(comp.def)
    plain.attached()
    plain.methods.focus.call(plain)
    expect(plain.data.focusAttr).toBe(true)
    expect(plain.data.isInputFocus).toBe(false)
    plain.methods.blur.call(plain)
    expect(plain.data.focusAttr).toBe(false)

    const vk = mountDef(comp.def, {props: {isVirtualKeyboard: true}})
    vk.attached()
    vk.methods.focus.call(vk)
    expect(vk.data.isInputFocus).toBe(true)
    vk.methods.blur.call(vk)
    expect(vk.data.isInputFocus).toBe(false)
  })

  it('clearInput：清空并回焦（非潜伏标题）；潜伏标题不回焦', () => {
    const a = mountDef(comp.def, {props: {value: 'abc'}})
    a.attached()
    a.methods.onClearTap.call(a)
    expect(a.data.inputValue).toBe('')
    expect(a.data.focusAttr).toBe(true)

    const b = mountDef(comp.def, {props: {value: 'abc', isTitleLatent: true}})
    b.attached()
    b.methods.stopPreview.call(b)
    expect(b.data.inputValue).toBe('')
    expect(b.data.focusAttr).toBe(false)
  })

  it('clearInput：预览态复位 isPreview', () => {
    const inst = mountDef(comp.def, {props: {previewType: 'money'}})
    inst.attached()
    expect(inst.data.isPreview).toBe(true)
    inst.methods.clearInput.call(inst)
    expect(inst.data.isPreview).toBe(false)
  })
})

describe('input-item 组件：虚拟键盘事件', () => {
  it('onFakeInputClick：disabled/readonly 阻断；正常点击先糊后聚', () => {
    const disabled = mountDef(comp.def, {props: {isVirtualKeyboard: true, disabled: true}})
    disabled.attached()
    disabled.methods.onFakeInputClick.call(disabled)
    expect(disabled.data.isInputFocus).toBe(false)

    const readonly = mountDef(comp.def, {props: {isVirtualKeyboard: true, readonly: true}})
    readonly.attached()
    readonly.methods.onFakeInputClick.call(readonly)
    expect(readonly.data.isInputFocus).toBe(false)

    const ok = mountDef(comp.def, {props: {isVirtualKeyboard: true}})
    ok.attached()
    ok.methods.onFakeInputClick.call(ok)
    expect(ok.data.isInputFocus).toBe(true)
  })

  it('onKeyboardEnter：detail 对象/裸值双形态；追加并格式化 + 编辑态 500ms', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {props: {type: 'bankCard', isVirtualKeyboard: true}})
    inst.attached()
    inst.methods.onKeyboardEnter.call(inst, {detail: {value: '6222'}})
    expect(inst.data.inputValue).toBe('6222')
    inst.methods.onKeyboardEnter.call(inst, {detail: '020200112233' as never})
    expect(inst.data.inputValue).toBe('6222 0202 0011 2233')
    expect(inst.data.isInputEditing).toBe(true)
    vi.advanceTimersByTime(500)
    expect(inst.data.isInputEditing).toBe(false)
  })

  it('onKeyboardEnter：isPreview 先退出预览；maxlength 满后拦截', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {
      props: {previewType: 'text', maxlength: 5, isVirtualKeyboard: true},
    })
    inst.attached()
    expect(inst.data.isPreview).toBe(true)
    inst.methods.onKeyboardEnter.call(inst, {detail: {value: '1'}})
    expect(inst.data.isPreview).toBe(false)
    inst.methods.onKeyboardEnter.call(inst, {detail: {value: '234'}})
    expect(inst.data.inputValue).toBe('1234')
    inst.methods.onKeyboardEnter.call(inst, {detail: {value: '5'}})
    expect(inst.data.inputValue).toBe('12345')
    inst.methods.onKeyboardEnter.call(inst, {detail: {value: '6'}})
    expect(inst.data.inputValue).toBe('12345') // 已满拦截
  })

  it('onKeyboardDelete：money 千分位回退；删除后退出预览；空值短路', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {
      props: {type: 'money', value: '1,000', isVirtualKeyboard: true},
    })
    inst.attached()
    inst.methods.onKeyboardDelete.call(inst)
    expect(inst.data.inputValue).toBe('100')
    inst.setData({isPreview: true})
    inst.methods.onKeyboardDelete.call(inst)
    expect(inst.data.isPreview).toBe(false)
    expect(inst.data.inputValue).toBe('') // stopPreview 清空
    inst.methods.onKeyboardDelete.call(inst)
    expect(inst.data.inputValue).toBe('') // 空值短路
  })

  it('onKeyboardConfirm：confirm {name, value}', () => {
    const inst = mountDef(comp.def, {props: {name: 'vk', value: '9'}})
    inst.attached()
    inst.methods.onKeyboardConfirm.call(inst)
    expect(inst.eventsOf('confirm')).toEqual([
      {name: 'confirm', detail: {name: 'vk', value: '9'}},
    ])
  })

  it('onKeyboardVisibleChange：value=false 收起聚焦；其余不动（含 detail 缺失）', () => {
    const inst = mountDef(comp.def, {props: {isVirtualKeyboard: true}})
    inst.attached()
    inst.methods.focus.call(inst)
    expect(inst.data.isInputFocus).toBe(true)
    inst.methods.onKeyboardVisibleChange.call(inst, {detail: {value: true}})
    expect(inst.data.isInputFocus).toBe(true)
    inst.methods.onKeyboardVisibleChange.call(inst, {detail: {value: false}})
    expect(inst.data.isInputFocus).toBe(false)
    inst.methods.onKeyboardVisibleChange.call(inst, {} as never)
    expect(inst.data.isInputFocus).toBe(false)
  })
})
