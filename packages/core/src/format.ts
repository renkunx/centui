/**
 * 输入值格式化（自 v2 _util/formate-value.js 迁移，行为与 v2 逐一对照测试）。
 * 被 input-item / number-keyboard / cashier 等组件用于银行卡、手机号等分组展示。
 */

export interface FormattedValue {
  value: string
  range: number | undefined
}

/**
 * 按分组规则插入间隔符
 * @param gapRule 分组长度规则，如 '4|4|4|4'
 * @param range 光标位置（缺省为格式化后长度）
 * @param isAdd 1 输入 / -1 删除，用于光标跨间隔符的修正
 */
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
  })
  let j = 0
  arr.some((n, i) => {
    // Remove the excess part
    if (i > rule[rule.length - 1] - 1) {
      return
    }
    if (i > 0 && i === rule[j]) {
      showValue = showValue + gap + n
      j++
    } else {
      showValue = showValue + '' + n
    }
  })
  let adapt = 0
  rule.some((n, k) => {
    if (range === +n + 1 + k) {
      adapt = 1 * isAdd
    }
  })
  range = typeof range !== 'undefined' ? (range === 0 ? 0 : range + adapt) : showValue.length
  return { value: showValue, range }
}

/**
 * 按固定步长插入间隔符
 * @param step 步长
 * @param direction 'right' 从右往左分组 / 'left' 从左往右分组
 * @param isAdd 1 输入 / -1 删除
 * @param oldValue 变更前的值，用于间隔符增减时光标修正
 */
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
    return { value, range }
  }

  const arr = value && value.split('')
  let _range = range
  let showValue = ''

  if (direction === 'right') {
    for (let j = arr.length - 1, k = 0; j >= 0; j--, k++) {
      const m = arr[j]
      showValue = k > 0 && k % step === 0 ? m + gap + showValue : m + '' + showValue
    }
    if (isAdd === 1) {
      // 在添加的情况下，如果添加前字符串的长度减去新的字符串的长度为2，说明多了一个间隔符，需要调整range
      if (oldValue.length - showValue.length === -2) {
        _range = range + 1
      }
    } else {
      // 在删除情况下，如果删除前字符串的长度减去新的字符串的长度为2，说明少了一个间隔符，需要调整range
      if (oldValue.length - showValue.length === 2) {
        _range = range - 1
      }
      // 删除到最开始，range 保持 0
      if (_range <= 0) {
        _range = 0
      }
    }
  } else {
    arr.some((n, i) => {
      showValue = i > 0 && i % step === 0 ? showValue + gap + n : showValue + '' + n
    })
    const adapt = range % (step + 1) === 0 ? 1 * isAdd : 0
    _range = typeof range !== 'undefined' ? (range === 0 ? 0 : range + adapt) : showValue.length
  }

  return { value: showValue, range: _range }
}

/**
 * 去除所有间隔符还原原始值
 */
export function trimValue(value: string | undefined, gap = ' '): string {
  const val = typeof value === 'undefined' ? '' : value
  const reg = new RegExp(gap, 'g')
  return val.toString().replace(reg, '')
}
