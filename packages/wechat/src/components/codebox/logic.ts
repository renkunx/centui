/**
 * Codebox 纯逻辑（自 Vue 版 codebox/Codebox.vue 的 onInputChange/onEnter/onDelete
 * 语义提取）。
 */
export type CodeboxMaxlength = number | string

/** 展示格数：Math.abs(parseInt(maxlength)) || 1（对齐 Vue num computed） */
export function parseBoxCount(maxlength: CodeboxMaxlength): number {
  return Math.abs(parseInt(String(maxlength), 10)) || 1
}

/** maxlength > 0 走分格渲染，否则走 holder 输入框（对齐 Vue 模板分支） */
export function useBoxes(maxlength: CodeboxMaxlength): boolean {
  return Number(maxlength) > 0
}

/** maxlength <= 0 视为不限长（对齐 Vue v2 语义收敛） */
export function isUnlimited(maxNum: number): boolean {
  return maxNum <= 0
}

export interface CodeboxIngest {
  code: string
  submit: boolean
}

/** 系统键盘输入（对齐 Vue onInputChange）：超长时保持旧值 */
export function ingestSystemInput(
  currentCode: string,
  value: string,
  maxNum: number,
): CodeboxIngest {
  const code = maxNum <= 0 || value.length <= maxNum ? value : currentCode
  return {code, submit: code.length === maxNum}
}

/** 自定义键盘数字键（对齐 Vue onEnter）：'.' 不追加；满位触发 submit */
export function ingestKeyboardKey(
  currentCode: string,
  key: string,
  maxNum: number,
): CodeboxIngest {
  const canAppend = (maxNum <= 0 || currentCode.length < maxNum) && key !== '.'
  const code = canAppend ? currentCode + key : currentCode
  return {code, submit: code.length === maxNum}
}

/** 删除末位（对齐 Vue onDelete） */
export function ingestDelete(code: string): string {
  return code.slice(0, code.length - 1)
}

/** 渲染格子视图（对齐 Vue 模板：filled/active/blink 分支） */
export interface CodeboxCell {
  no: number
  char: string
  filled: boolean
  active: boolean
}

export function buildCodeboxCells(
  code: string,
  maxlength: CodeboxMaxlength,
  focused: boolean,
): CodeboxCell[] {
  const num = parseBoxCount(maxlength)
  const cells: CodeboxCell[] = []
  for (let i = 1; i <= num; i++) {
    const char = code.charAt(i - 1)
    cells.push({
      no: i - 1,
      char,
      filled: !!char,
      active: i === code.length + 1 && !!focused,
    })
  }
  return cells
}
