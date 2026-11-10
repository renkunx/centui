/**
 * codebox 纯逻辑测试：maxlength 解析、系统/自定义键盘输入语义（满位 submit、
 * '.' 不追加、超长保持旧值），对照 Vue 版 Codebox.vue。
 */
import {describe, it, expect} from 'vitest'
import {loadComponent, mountDef, type Mounted} from '../helpers/weapp'
import {
  buildCodeboxCells,
  ingestDelete,
  ingestKeyboardKey,
  ingestSystemInput,
  parseBoxCount,
  useBoxes,
} from '../../src/components/codebox/logic'

describe('codebox/logic maxlength 解析', () => {
  it('parseBoxCount：Math.abs(parseInt) || 1', () => {
    expect(parseBoxCount(4)).toBe(4)
    expect(parseBoxCount('0')).toBe(1)
    expect(parseBoxCount(-3)).toBe(3)
    expect(parseBoxCount('-6')).toBe(6)
    expect(parseBoxCount('abc')).toBe(1)
  })

  it('useBoxes：maxlength > 0 分格，否则 holder', () => {
    expect(useBoxes(4)).toBe(true)
    expect(useBoxes(0)).toBe(false)
    expect(useBoxes(-1)).toBe(false)
  })
})

describe('codebox/logic 系统键盘输入（onInputChange 语义）', () => {
  it('未满位：直接落地，不 submit', () => {
    expect(ingestSystemInput('', '12', 4)).toEqual({code: '12', submit: false})
  })

  it('达到 maxlength：submit', () => {
    expect(ingestSystemInput('', '1234', 4)).toEqual({code: '1234', submit: true})
  })

  it('超长（maxlength<=0 视为不限长）', () => {
    expect(ingestSystemInput('', '123456', 0)).toEqual({code: '123456', submit: false})
  })

  it('超长时保持旧值（Vue：code.value 不更新）', () => {
    expect(ingestSystemInput('12', '12345', 4)).toEqual({code: '12', submit: false})
  })
})

describe('codebox/logic 自定义键盘（onEnter 语义）', () => {
  it('追加数字', () => {
    expect(ingestKeyboardKey('12', '3', 4)).toEqual({code: '123', submit: false})
    expect(ingestKeyboardKey('123', '4', 4)).toEqual({code: '1234', submit: true})
  })

  it("'. ' 不追加（小数点排除）", () => {
    expect(ingestKeyboardKey('12', '.', 4)).toEqual({code: '12', submit: false})
  })

  it('已满位再按键：值不变但再次 submit（对齐 Vue code.length === maxLengthNum 判定）', () => {
    expect(ingestKeyboardKey('1234', '5', 4)).toEqual({code: '1234', submit: true})
  })

  it('maxlength <= 0 不限长', () => {
    expect(ingestKeyboardKey('123', '4', 0)).toEqual({code: '1234', submit: false})
  })
})

describe('codebox/logic 删除与格子视图', () => {
  it('ingestDelete 末删，空值安全', () => {
    expect(ingestDelete('123')).toBe('12')
    expect(ingestDelete('')).toBe('')
  })

  it('buildCodeboxCells：格数、填充与 active 光标', () => {
    const cells = buildCodeboxCells('12', 4, true)
    expect(cells).toHaveLength(4)
    expect(cells[0]).toEqual({no: 0, char: '1', filled: true, active: false})
    expect(cells[1]).toEqual({no: 1, char: '2', filled: true, active: false})
    // active：i === code.length + 1（第 3 格闪烁光标）
    expect(cells[2].active).toBe(true)
    expect(cells[3].active).toBe(false)
  })

  it('buildCodeboxCells：未聚焦无 active', () => {
    const cells = buildCodeboxCells('12', 4, false)
    expect(cells.every((c) => !c.active)).toBe(true)
  })

  it('buildCodeboxCells：空 code 时第 1 格 active', () => {
    const cells = buildCodeboxCells('', 4, true)
    expect(cells[0].active).toBe(true)
    expect(cells[0].filled).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// codebox 组件实例（index.ts）：observers / lifetimes / 键盘路径 methods
// ---------------------------------------------------------------------------
const comp = await loadComponent(() => import('../../src/components/codebox/index'))

interface CodeboxView {
  code: string
  focused: boolean
  focusSystem: boolean
  useBoxes: boolean
  keyboardType: string
  nativeMaxlength: number
  inputTypeMp: string
}

function view(inst: Mounted): CodeboxView {
  const d = inst.data
  return {
    code: d.code as string,
    focused: d.focused as boolean,
    focusSystem: d.focusSystem as boolean,
    useBoxes: d.useBoxes as boolean,
    keyboardType: d.keyboardType as string,
    nativeMaxlength: d.nativeMaxlength as number,
    inputTypeMp: d.inputTypeMp as string,
  }
}

describe('codebox 组件 attached 初始化', () => {
  it('code 对齐初始 value；autofocus 驱动 focused；静态态刷新', () => {
    const inst = mountDef(comp.def, {props: {value: '12', autofocus: true}})
    inst.attached()
    expect(view(inst)).toMatchObject({
      code: '12',
      focused: true,
      useBoxes: true,
      keyboardType: 'simple',
      nativeMaxlength: 4,
      inputTypeMp: 'number',
    })
    const boxes = inst.data.boxes as Array<{char: string; filled: boolean; active: boolean}>
    expect(boxes).toHaveLength(4)
    expect(boxes[0]).toMatchObject({char: '1', filled: true, active: false})
    expect(boxes[2].active).toBe(true) // 光标落在 code.length+1 格
  })

  it('maxlength <= 0 → holder 输入框形态（professional / nativeMaxlength -1）', () => {
    const inst = mountDef(comp.def, {props: {maxlength: 0}})
    inst.attached()
    expect(view(inst)).toMatchObject({useBoxes: false, keyboardType: 'professional', nativeMaxlength: -1})
  })

  it('字符串 maxlength 走 Number 语义；非 tel inputType 原样映射', () => {
    const inst = mountDef(comp.def, {props: {maxlength: '6', inputType: 'digit'}})
    inst.attached()
    expect(view(inst)).toMatchObject({useBoxes: true, nativeMaxlength: 6, inputTypeMp: 'digit'})
    // inputType 不在 'maxlength, system' observer 键内：手动刷新覆盖非 tel 分支
    inst.setData({inputType: 'text'})
    inst.methods.__refreshStatic()
    expect(view(inst).inputTypeMp).toBe('text')
    // observer 'maxlength, system' → __refreshStatic + __refresh 重建
    inst.setData({maxlength: 3, system: true})
    expect(view(inst)).toMatchObject({useBoxes: true, nativeMaxlength: 3, keyboardType: 'simple'})
  })

  it('value observer：外部回写同步 code 并重建 boxes；值相同跳过（!== 分支）', () => {
    const inst = mountDef(comp.def, {props: {value: '5'}})
    inst.attached()
    inst.setData({value: '86'})
    expect(view(inst).code).toBe('86')
    // __commit 只写 code；外部 value 追平到当前 code → observer 跳过 setData
    inst.methods.__commit('99')
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: '99'}}])
    inst.setData({value: '99'})
    expect(view(inst).code).toBe('99')
  })
})

describe('codebox 聚焦 / 盒子点击', () => {
  it('onBoxTap / focus：非 system 只置 focused', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    inst.methods.onBoxTap()
    expect(view(inst)).toMatchObject({focused: true, focusSystem: false})
    inst.methods.blur()
    expect(view(inst)).toMatchObject({focused: false, focusSystem: false})
  })

  it('system=true：focus/blur 同步 focusSystem', () => {
    const inst = mountDef(comp.def, {props: {system: true}})
    inst.attached()
    inst.methods.focus()
    expect(view(inst)).toMatchObject({focused: true, focusSystem: true})
    inst.methods.blur()
    expect(view(inst)).toMatchObject({focused: false, focusSystem: false})
  })

  it('disabled：onBoxTap 与 focus 均阻断', () => {
    const inst = mountDef(comp.def, {props: {disabled: true}})
    inst.attached()
    inst.methods.onBoxTap()
    inst.methods.focus()
    expect(view(inst)).toMatchObject({focused: false, focusSystem: false})
  })
})

describe('codebox 系统键盘路径', () => {
  it('onSystemInput：未满位只 change；满位再 submit', () => {
    const inst = mountDef(comp.def, {props: {maxlength: 4}})
    inst.attached()
    inst.methods.onSystemInput({detail: {value: '12'}})
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: '12'}}])
    expect(inst.eventsOf('submit')).toEqual([])
    inst.methods.onSystemInput({detail: {value: '1234'}})
    expect(inst.eventsOf('submit')).toEqual([{name: 'submit', detail: {value: '1234'}}])
    expect(view(inst).code).toBe('1234')
  })

  it('onSystemInput：超长保持旧值（ingestSystemInput 防护）', () => {
    const inst = mountDef(comp.def, {props: {maxlength: 4}})
    inst.attached()
    inst.methods.onSystemInput({detail: {value: '12'}})
    inst.methods.onSystemInput({detail: {value: '123456'}})
    expect(view(inst).code).toBe('12')
  })

  it('onSystemFocus / onSystemBlur：focus/blur 事件 + blur 收起', () => {
    const inst = mountDef(comp.def, {props: {autofocus: true}})
    inst.attached()
    inst.methods.onSystemFocus()
    expect(inst.eventsOf('focus')).toHaveLength(1)
    inst.methods.onSystemBlur()
    expect(inst.eventsOf('blur')).toHaveLength(1)
    expect(view(inst).focused).toBe(false)
  })
})

describe('codebox 自定义键盘路径', () => {
  it('onKbEnter：detail 对象 {value} 追加；满位 submit', () => {
    const inst = mountDef(comp.def, {props: {maxlength: 2}})
    inst.attached()
    inst.methods.onKbEnter({detail: {value: '9'}})
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: '9'}}])
    inst.methods.onKbEnter({detail: {value: '5'}})
    expect(inst.eventsOf('submit')).toEqual([{name: 'submit', detail: {value: '95'}}])
  })

  it("onKbEnter：detail 为字符串原样追加；'.' 不追加", () => {
    const inst = mountDef(comp.def, {props: {maxlength: 4}})
    inst.attached()
    inst.methods.onKbEnter({detail: '3'})
    expect(view(inst).code).toBe('3')
    inst.methods.onKbEnter({detail: '.'})
    expect(view(inst).code).toBe('3')
  })

  it('onKbEnter：detail null 兜底 String(null)（防御分支）', () => {
    const inst = mountDef(comp.def, {props: {maxlength: -1}})
    inst.attached()
    inst.methods.onKbEnter({detail: null})
    expect(view(inst).code).toBe('null')
    expect(inst.eventsOf('submit')).toEqual([])
  })

  it('onDelete / onConfirm', () => {
    const inst = mountDef(comp.def, {props: {value: '123'}})
    inst.attached()
    inst.methods.onDelete()
    expect(view(inst).code).toBe('12')
    inst.methods.onConfirm()
    expect(inst.eventsOf('submit')).toEqual([{name: 'submit', detail: {value: '12'}}])
  })

  it('onKbVisibleChange：false 收起；true / detail null 不动', () => {
    const inst = mountDef(comp.def, {props: {autofocus: true}})
    inst.attached()
    expect(view(inst).focused).toBe(true)
    inst.methods.onKbVisibleChange({detail: {value: true}})
    expect(view(inst).focused).toBe(true)
    inst.methods.onKbVisibleChange({detail: null})
    expect(view(inst).focused).toBe(true)
    inst.methods.onKbVisibleChange({detail: {value: false}})
    expect(view(inst).focused).toBe(false)
  })
})
