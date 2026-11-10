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

  const arr: string[] = value.split('')
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
        _range = (range as number) + 1
      }
    } else {
      // 在删除情况下，如果删除前字符串的长度减去新的字符串的长度为2，说明少了一个间隔符，需要调整range
      if (oldValue.length - showValue.length === 2) {
        _range = (range as number) - 1
      }
      // 删除到最开始，range 保持 0
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

  return { value: showValue, range: _range }
}

/**
 * 去除所有间隔符还原原始值
 * @param gap 间隔符；含正则特殊字符时先转义，避免被当作模式解释
 */
export function trimValue(value: string | undefined, gap = ' '): string {
  const val = typeof value === 'undefined' ? '' : value
  const escapedGap = gap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const reg = new RegExp(escapedGap, 'g')
  return val.toString().replace(reg, '')
}

/**
 * 金额/数字展示格式化（自 v2 components/amount filters 迁移，供 Vue/React 双端复用）。
 */

/** 十进制数字串进一（'099' -> '100'，'999' -> '1000'） */
function incrementDigits(digits: string): string {
  const arr = digits.split('')
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === '9') {
      arr[i] = '0'
    } else {
      arr[i] = String(Number(arr[i]) + 1)
      return arr.join('')
    }
  }
  return `1${arr.join('')}`
}

/**
 * 指定精度舍入并输出定点字符串
 * @param precision 小数位数（< 0 时按 0 处理，非整数向下取整，上限 100，与 toFixed 一致）
 * @param roundUp true 四舍五入 —— 按绝对值 half-away-from-zero，正负对称
 *                （正数行为与 v2 的 Math.round 一致，-1.005 -> '-1.01'）；
 *                false 向零截断。
 *
 * 基于 String(value) 的十进制数字串做整数化处理：显式展开指数记数
 * （|value| < 1e-6 或 >= 1e21 时 String(value) 为 '1e-7' / '1e+21' 形式），
 * 任意量级（含极小/极大值）都不会产生 "NaN"。非有限输入原样返回
 * 'NaN' / 'Infinity' / '-Infinity'。全零结果不输出负号（'-0.00' -> '0.00'）。
 */
export function toFixedPrecision(value: number, precision: number, roundUp = true): string {
  if (!Number.isFinite(value)) {
    return String(value)
  }
  const p = precision > 0 ? Math.min(Math.floor(precision), 100) : 0
  const negative = value < 0

  // 展开为「整数位串 + 小数位串」的规范十进制形式
  const str = String(negative ? -value : value)
  let mantissa = str
  let exponent = 0
  const eIndex = str.indexOf('e')
  if (eIndex !== -1) {
    mantissa = str.slice(0, eIndex)
    exponent = parseInt(str.slice(eIndex + 1), 10)
  }
  const dotIndex = mantissa.indexOf('.')
  const digits = dotIndex === -1 ? mantissa : mantissa.replace('.', '')
  let decimalPos = dotIndex === -1 ? mantissa.length : dotIndex
  decimalPos += exponent

  let integerPart: string
  let fraction: string
  if (decimalPos <= 0) {
    integerPart = '0'
    fraction = '0'.repeat(-decimalPos) + digits
  } else if (decimalPos >= digits.length) {
    integerPart = digits + '0'.repeat(decimalPos - digits.length)
    fraction = ''
  } else {
    integerPart = digits.slice(0, decimalPos)
    fraction = digits.slice(decimalPos)
  }

  // 截断到目标精度；roundUp 时按小数点后 p+1 位决定是否进一
  let combined = integerPart + fraction.slice(0, p).padEnd(p, '0')
  if (roundUp && fraction.length > p && fraction.charCodeAt(p) >= 53 /* '5' */) {
    combined = incrementDigits(combined)
  }

  const prefix = /^0*$/.test(combined) ? '' : negative ? '-' : ''
  if (p > 0) {
    if (combined.length <= p) {
      combined = '0'.repeat(p - combined.length + 1) + combined
    }
    return `${prefix}${combined.slice(0, combined.length - p)}.${combined.slice(combined.length - p)}`
  }
  return `${prefix}${combined}`
}

/**
 * 千分位等分组展示：仅格式化整数部分，小数部分原样保留，负号前置
 */
export function formatNumberWithSeparator(value: string, separator = ','): string {
  const numberParts = value.split('.')
  let integerValue = numberParts[0]
  const decimalValue = numberParts[1] || ''

  let sign = ''
  if (integerValue.startsWith('-')) {
    integerValue = integerValue.substring(1)
    sign = '-'
  }

  const formatedValue = formatValueByGapStep(3, integerValue, separator, 'right', 0, 1)
  return decimalValue
    ? `${sign}${formatedValue.value}.${decimalValue}`
    : `${sign}${formatedValue.value}`
}

const cnNums = [
  '\u96f6',
  '\u58f9',
  '\u8d30',
  '\u53c1',
  '\u8086',
  '\u4f0d',
  '\u9646',
  '\u67d2',
  '\u634c',
  '\u7396',
]
// 拾 佰 仟
const cnIntRadice = ['', '\u62fe', '\u4f70', '\u4edf']
// 万 亿 兆
const cnIntUnits = ['', '\u4e07', '\u4ebf', '\u5146']
// 角 分 厘 毫
const cnDecUnits = ['\u89d2', '\u5206', '\u5398', '\u6beb']
const cnInteger = '\u6574' // 整
const cnIntLast = '\u5143' // 元
const cnNegative = '\u8d1f' // 负

const maxCapitalNum = 1e15 // v2 字面量 999999999999999.9999 的实际 double 值

/**
 * 数字转中文大写金额（精确到毫，超出上限返回空串）
 */
export function numberToChineseCapital(number: number | string): string {
  let capitalStr = ''

  if (number === '') {
    return ''
  }

  let num = parseFloat(String(number))

  if (Number.isNaN(num)) {
    return ''
  }

  let negative = false
  if (num < 0) {
    negative = true
    num = Math.abs(num)
  }

  if (num >= maxCapitalNum) {
    return ''
  }

  if (num === 0) {
    return cnNums[0] + cnIntLast + cnInteger
  }

  const numberStr = String(num)
  let integerNum: string
  let decimalNum: string

  if (numberStr.indexOf('.') === -1) {
    integerNum = numberStr
    decimalNum = ''
  } else {
    const parts = numberStr.split('.')
    integerNum = parts[0]
    decimalNum = parts[1].slice(0, 4)
  }

  // Convert integer part
  let hasInteger = false
  if (parseInt(integerNum, 10) > 0) {
    hasInteger = true
    let zeroCount = 0
    for (let i = 0, intLen = integerNum.length; i < intLen; i++) {
      const n = integerNum.charAt(i)
      const p = intLen - i - 1
      const q = Math.floor(p / 4)
      const m = p % 4
      if (n === '0') {
        zeroCount++
      } else {
        if (zeroCount > 0) {
          capitalStr += cnNums[0]
        }
        zeroCount = 0
        capitalStr += cnNums[parseInt(n)] + cnIntRadice[m]
      }
      if (m === 0 && zeroCount < 4) {
        capitalStr += cnIntUnits[q]
      }
    }
    capitalStr += cnIntLast
  }

  // Convert decimal part
  if (decimalNum !== '') {
    // 财务规范：整数部位后有「元」，角位为 0 且后续存在非零位时需补「零」
    // （如 10.05 -> 壹拾元零伍分）；整数部分为 0（无「元」）时不补。
    let pendingZero = hasInteger && decimalNum.charAt(0) === '0'
    for (let i = 0, decLen = decimalNum.length; i < decLen; i++) {
      const n = decimalNum.charAt(i)
      if (n !== '0') {
        if (pendingZero) {
          capitalStr += cnNums[0]
          pendingZero = false
        }
        capitalStr += cnNums[Number(n)] + cnDecUnits[i]
      }
    }
  }

  if (capitalStr === '') {
    capitalStr += cnNums[0] + cnIntLast + cnInteger
  } else if (decimalNum === '') {
    capitalStr += cnInteger
  }

  if (negative) {
    capitalStr = `${cnNegative}${capitalStr}`
  }
  return capitalStr
}
