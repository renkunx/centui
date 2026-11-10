/**
 * license-plate 顺序填写规则测试（对照 packages/vue/test/components/license-plate-order.spec.ts
 * 固化的契约：无序放行 / 空中间位拦截 / 写满自动 confirm / 删除回退与键盘面切换）。
 */
import {describe, it, expect} from 'vitest'
import {
  applyDefaultValue,
  buildKeyboard,
  canSelectBox,
  DEFAULT_SHORTCUTS,
  deleteValue,
  emptyKeyArray,
  enterValue,
  joinPlate,
  LETTER_KEYS,
} from '../../src/components/license-plate/logic'

describe('license-plate/顺序填写规则（disorderClick）', () => {
  const empty = emptyKeyArray()
  expect(empty).toHaveLength(8)

  it('disorderClick=true（默认）允许无序点击任意键位', () => {
    expect(canSelectBox(empty, 3, true)).toBe(true)
    expect(canSelectBox(empty, 7, true)).toBe(true)
  })

  it('disorderClick=false 时点击"前后两位均空"的中间位被拦截', () => {
    // 第 0 位放行
    expect(canSelectBox(empty, 0, false)).toBe(true)
    // 第 2 位（第 1 位未填）被拦截——对齐 spec：boxes[2] 不获得 active
    expect(canSelectBox(empty, 2, false)).toBe(false)
  })

  it('disorderClick=false 时"前一位已填"的键位可顺序推进', () => {
    const filled = applyDefaultValue(empty, '京A')
    expect(filled[0]).toBe('京')
    expect(filled[1]).toBe('A')
    expect(canSelectBox(filled, 2, false)).toBe(true)
    // 后一位已填同样放行（Vue 守卫为 prev || next）
    expect(canSelectBox(filled, 0, false)).toBe(true)
  })

  it('onEnter 写入当前位并推进，写满最后一位自动 confirm', () => {
    let keyArray = emptyKeyArray()
    let selectedIndex = 0
    let confirmed = false
    // 省份 + 7 位字母数字（对齐 spec 的 8 次输入）
    const input = ['京', 'A', '1', '2', '3', '4', '5', '6']
    for (const value of input) {
      const result = enterValue(keyArray, selectedIndex, value)
      keyArray = result.keyArray
      selectedIndex = result.selectedIndex
      if (result.confirmed) confirmed = true
    }
    expect(confirmed).toBe(true)
    expect(joinPlate(keyArray)).toBe('京A123456')
    expect(selectedIndex).toBe(7)
  })

  it('onDelete 清空当前位并回退选中位', () => {
    const filled = applyDefaultValue(emptyKeyArray(), '京A')
    const result = deleteValue(filled, 1, 'division')
    expect(result.keyArray[1]).toBe('')
    expect(result.selectedIndex).toBe(0)
    expect(result.hideKeyboard).toBe(false)
    // selectedIndex=0 时回传省份键盘面（键盘面由 selectedIndex 驱动）
    expect(buildKeyboard(result.selectedIndex, DEFAULT_SHORTCUTS).keyboardType).toBe(1)
  })

  it('第 0 位删除：division 收起键盘，popUp 不收起', () => {
    const division = deleteValue(emptyKeyArray(), 0, 'division')
    expect(division.hideKeyboard).toBe(true)
    const popUp = deleteValue(emptyKeyArray(), 0, 'popUp')
    expect(popUp.hideKeyboard).toBe(false)
  })
})

describe('license-plate/键盘面板', () => {
  it('第一位：省份简写键盘（keyboardType 1 + shortcuts）', () => {
    const kb = buildKeyboard(0, DEFAULT_SHORTCUTS)
    expect(kb.keyboardType).toBe(1)
    expect(kb.shortcuts).toBe(DEFAULT_SHORTCUTS)
    expect(kb.mixedKeyboard).toEqual([])
  })

  it('第二位起：字母数字混合键盘，数字键禁用（第二位）', () => {
    const kb = buildKeyboard(1, DEFAULT_SHORTCUTS)
    expect(kb.keyboardType).toBe(2)
    expect(kb.mixedKeyboard.slice(0, 10).every(item => item.disabled)).toBe(true)
    // 第三位起数字恢复
    const kb3 = buildKeyboard(2, DEFAULT_SHORTCUTS)
    expect(kb3.mixedKeyboard.slice(0, 10).every(item => !item.disabled)).toBe(true)
  })

  it('混合键盘功能键：删除键插于 S/T 之间（splice 19），确定键追加尾部', () => {
    const kb = buildKeyboard(2, DEFAULT_SHORTCUTS)
    const letters = kb.mixedKeyboard.slice(10)
    // 10 数字 + 26 字母 + 2 功能键
    expect(kb.mixedKeyboard).toHaveLength(38)
    const delIndex = letters.findIndex(item => item.type === 'delete')
    const confirmIndex = letters.findIndex(item => item.type === 'confirm')
    expect(delIndex).toBe(19) // A..S 共 19 个字母后
    expect(letters[delIndex - 1].value).toBe('S')
    expect(letters[delIndex + 1].value).toBe('T')
    expect(confirmIndex).toBe(letters.length - 1)
    expect(letters[confirmIndex]).toMatchObject({type: 'confirm', text: '确定', disabled: false})
  })

  it('字母 I/O 禁用（车牌字母排除）', () => {
    const disabled = LETTER_KEYS.filter(item => item.disabled).map(item => item.value)
    expect(disabled).toEqual(['I', 'O'])
  })
})

describe('license-plate/defaultValue 与 joinPlate', () => {
  it('defaultValue 按位覆盖，缺省位清空（Vue watcher）', () => {
    const base = applyDefaultValue(emptyKeyArray(), '京A12345')
    expect(base[0]).toBe('京')
    expect(base[6]).toBe('5')
    expect(base[7]).toBe('')
    // 空串不改写（Vue watch 仅在非空时覆盖）
    const untouched = ['京', '', '', '', '', '', '', '']
    expect(applyDefaultValue(untouched, '')).toEqual(untouched)
  })

  it('joinPlate：空位补空格（keyArrayCopy 契约）', () => {
    expect(joinPlate(['京', 'A', '', '', '', '', '', ''])).toBe('京A      ')
  })
})
