/**
 * codebox 纯逻辑测试：maxlength 解析、系统/自定义键盘输入语义（满位 submit、
 * '.' 不追加、超长保持旧值），对照 Vue 版 Codebox.vue。
 */
import {describe, it, expect} from 'vitest'
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
