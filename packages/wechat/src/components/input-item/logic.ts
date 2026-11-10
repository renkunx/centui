/**
 * InputItem 纯逻辑（自 Vue 版 input-item/InputItem.vue 的 formateValue/subValue/
 * stripSeparators 管线与 @centui/core format.ts 提取）。
 *
 * formatValueByGapRule / formatValueByGapStep / trimValue 与 @centui/core 同步实现
 * （小程序逻辑测试环境不解析 @centui/core 包依赖；构建期 bundle 语义一致），
 * 修改任一侧必须同步另一侧。
 */
export interface FormattedValue {
  value: string
  range: number | undefined
}

export type Formation = (
  name: string | number,
  curValue: string,
  curPos: number,
) => FormattedValue | undefined

// ---------------------------------------------------------------------------
// 以下三个函数与 packages/core/src/format.ts 逐一对照
// ---------------------------------------------------------------------------

/** 按分组规则插入间隔符（gapRule 如 '3|4|4'） */
export function formatValueByGapRule(
  gapRule: string,
  value: string,
  gap = ' ',
  range?: number,
  isAdd = 1,
): FormattedValue {
  const arr = value ? value.split('') : []
  let showValue = ''
  const rule: number[] = []
  gapRule.split('|').some((_n, j) => {
    rule[j] = +_n + (rule[j - 1] ? +rule[j - 1] : 0)
    return false
  })
  let j = 0
  arr.some((n, i) => {
    // Remove the excess part
    if (i > rule[rule.length - 1] - 1) {
      return true
    }
    if (i > 0 && i === rule[j]) {
      showValue = showValue + gap + n
      j++
    } else {
      showValue = showValue + '' + n
    }
    return false
  })
  let adapt = 0
  rule.some((n, k) => {
    if (range === +n + 1 + k) {
      adapt = 1 * isAdd
      return true
    }
    return false
  })
  const finalRange =
    typeof range !== 'undefined' ? (range === 0 ? 0 : range + adapt) : showValue.length
  return {value: showValue, range: finalRange}
}

/** 按固定步长插入间隔符（direction 'right' 从右往左分组） */
export function formatValueByGapStep(
  step: number,
  value: string,
  gap = ' ',
  direction: 'right' | 'left' = 'right',
  range?: number,
  isAdd = 1,
  oldValue = '',
): FormattedValue {
  if (value.length === 0) {
    return {value, range}
  }

  const arr: string[] = value.split('')
  let _range = range
  let showValue = ''

  if (direction === 'right') {
    for (let j = arr.length - 1, k = 0; j >= 0; j--, k++) {
      const m = arr[j]
      showValue = k > 0 && k % step === 0 ? m + gap + showValue : m + '' + showValue
    }
    if (isAdd === 1) {
      if (oldValue.length - showValue.length === -2) {
        _range = (range as number) + 1
      }
    } else {
      if (oldValue.length - showValue.length === 2) {
        _range = (range as number) - 1
      }
      if (_range !== undefined && _range <= 0) {
        _range = 0
      }
    }
  } else {
    arr.forEach((n, i) => {
      showValue = i > 0 && i % step === 0 ? showValue + gap + n : showValue + '' + n
    })
    const adapt = range !== undefined && range % (step + 1) === 0 ? 1 * isAdd : 0
    _range = typeof range !== 'undefined' ? (range === 0 ? 0 : range + adapt) : showValue.length
  }

  return {value: showValue, range: _range}
}

/** 去除所有间隔符还原原始值（gap 按字面量转义） */
export function trimValue(value: string | undefined, gap = ' '): string {
  const val = typeof value === 'undefined' ? '' : value
  const escapedGap = gap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const reg = new RegExp(escapedGap, 'g')
  return val.toString().replace(reg, '')
}

// ---------------------------------------------------------------------------
// InputItem 组件侧管线（对齐 Vue 版 InputItem.vue）
// ---------------------------------------------------------------------------

/** 剥离空白与千分位逗号（等价 v2 trimValue(val, '\\s|,')，修复后的显式字符类语义） */
export function stripSeparators(val: string): string {
  return val.replace(/[\s,]/g, '')
}

/** is-formative：显式 isFormative 或类型自带格式化（bankCard/phone/money/digit） */
export function isFormativeType(type: string, isFormative: boolean): boolean {
  return (
    isFormative || type === 'bankCard' || type === 'phone' || type === 'money' || type === 'digit'
  )
}

/** phone 类型输入上限恒为 11，其余取 maxlength prop（'' 视为不限） */
export function inputMaxlength(itemType: string, maxlength: string | number): string | number {
  return itemType === 'phone' ? 11 : maxlength
}

/** 按 maxlength 截断（'' / undefined / null 视为不限，对齐 Vue subValue） */
export function subValue(val: string, len: string | number | undefined | null): string {
  if (len !== '' && len !== undefined && len !== null) {
    return val.substring(0, Number(len))
  }
  return val
}

/** 键入方向：长度变短为删除 */
export function isAddOf(oldValue: string, curValue: string): 1 | -1 {
  return oldValue.length > curValue.length ? -1 : 1
}

export interface FormatInputOptions {
  type: string
  isFormative: boolean
  maxlength: string | number
  name: string | number
  oldValue: string
  curPos?: number
  formation?: Formation | null
}

/**
 * 格式化管线（对齐 Vue formateValue）：
 * 非格式化类型或空值直通 → 自定义 formation 优先 → 按类型默认格式化。
 */
export function formatInputValue(
  curValue: string,
  opts: FormatInputOptions,
): FormattedValue {
  const {type, isFormative, maxlength, name, oldValue} = opts
  const curPos = opts.curPos ?? 0
  const isAdd = isAddOf(oldValue, curValue)

  let result: FormattedValue = {value: curValue, range: curPos}

  // no format
  if (!isFormativeType(type, isFormative) || curValue === '') {
    return result
  }

  // custom format by user
  const customValue = opts.formation ? opts.formation(name, curValue, curPos) : undefined
  if (customValue) {
    return customValue
  }

  // default format by component
  let gap = ' '
  switch (type) {
    case 'bankCard': {
      const v = subValue(trimValue(curValue.replace(/\D/g, '')), maxlength)
      result = formatValueByGapStep(4, v, gap, 'left', curPos, isAdd, oldValue)
      break
    }
    case 'phone': {
      const v = subValue(trimValue(curValue.replace(/\D/g, '')), maxlength)
      result = formatValueByGapRule('3|4|4', v, gap, curPos, isAdd)
      break
    }
    case 'money': {
      gap = ','
      const v = subValue(trimValue(curValue.replace(/[^\d.]/g, '')), maxlength)
      const dotPos = v.indexOf('.')
      // format if no dot or new add dot or insert before dot
      const moneyCurValue = v.split('.')[0]
      const moneyCurDecimal = ~dotPos ? `.${v.split('.')[1]}` : ''

      result = formatValueByGapStep(
        3,
        trimValue(moneyCurValue, gap),
        gap,
        'right',
        curPos,
        isAdd,
        oldValue.split('.')[0],
      )
      result = {value: result.value + moneyCurDecimal, range: result.range}
      break
    }
    case 'digit': {
      result = {value: subValue(trimValue(curValue.replace(/\D/g, '')), maxlength), range: curPos}
      break
    }
  }

  return result
}

/** 对外发射值：格式化类型剥离分隔符（对齐 Vue watch(inputValue) 的 emitted） */
export function emittedValue(val: string, formative: boolean): string {
  return formative ? stripSeparators(val) : val
}

/** 测试环境空串、运行时 prefix-随机数（对齐 @centui/core randomId 契约） */
export function randomId(prefix = '', length = 8): string {
  const proc = (globalThis as unknown as {process?: {env?: Record<string, string>}}).process
  if (proc && proc.env && proc.env.VITEST) {
    return ''
  }
  return `${prefix}-${parseInt(`${Math.random() * Math.pow(10, length)}`)}`
}
