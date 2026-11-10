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
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/license-plate/index'))

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

  it('enterValue：value undefined → 空串写入（?? 兜底）', () => {
    const r = enterValue(emptyKeyArray(), 0, undefined)
    expect(r.keyArray[0]).toBe('')
    expect(r.selectedIndex).toBe(1)
  })
})

/**
 * 组件层（index.ts）：attached 初始化、selectedIndex/shortcuts/defaultValue observers、
 * onKeyMapping（先展开键盘再守卫）、onEnter/onDelete/onConfirm/onTitleBarCancel。
 */
describe('license-plate 组件', () => {
  it('attached：空 keyArray + 省份键盘面（keyboardType 1）', () => {
    const inst = mountDef(comp.def)
    inst.attached()
    expect(inst.data.keyArray).toEqual(emptyKeyArray())
    expect(inst.data.selectedIndex).toBe(0)
    expect(inst.data.keyboard.keyboardType).toBe(1)
    expect(inst.data.keyboard.shortcuts).toEqual(DEFAULT_SHORTCUTS)
  })

  it('attached：defaultValue 初始化车牌', () => {
    const inst = mountDef(comp.def, {props: {defaultValue: '京A12345'}})
    inst.attached()
    expect(inst.data.keyArray[0]).toBe('京')
    expect(inst.data.keyArray[6]).toBe('5')
    expect(inst.data.keyArray[7]).toBe('')
  })

  it('attached：shortcuts 为 null → 空表兜底（?? 分支）', () => {
    const inst = mountDef(comp.def, {props: {shortcuts: null}})
    inst.attached()
    expect(inst.data.keyboard.shortcuts).toEqual([])
  })

  it('observer：selectedIndex 变更重建键盘面（第 3 位 → 数字键恢复）', () => {
    const inst = mountDef(comp.def)
    inst.setData({selectedIndex: 2})
    expect(inst.data.keyboard.keyboardType).toBe(2)
    const nums = inst.data.keyboard.mixedKeyboard.slice(0, 10)
    expect(nums.every((item: {disabled: boolean}) => !item.disabled)).toBe(true)
  })

  it('observer：shortcuts 变更同步键盘面；null 回退空表（?? 分支）', () => {
    const inst = mountDef(comp.def)
    inst.setData({shortcuts: ['京', '沪']})
    expect(inst.data.keyboard.shortcuts).toEqual(['京', '沪'])
    inst.setData({shortcuts: null})
    expect(inst.data.keyboard.shortcuts).toEqual([])
  })

  it('observer：defaultValue 非空按位覆盖；空串不改写', () => {
    const inst = mountDef(comp.def)
    inst.setData({defaultValue: '沪B'})
    expect(inst.data.keyArray.slice(0, 3)).toEqual(['沪', 'B', ''])
    const before = inst.data.keyArray.slice()
    inst.setData({defaultValue: ''})
    expect(inst.data.keyArray).toEqual(before)
  })

  it('onKeyMapping：键盘未展开先展开，再切换选中位', () => {
    const inst = mountDef(comp.def)
    expect(inst.data.showDivisionKeyboard).toBe(false)
    inst.methods.onKeyMapping.call(inst, {detail: {index: 2}})
    expect(inst.data.showDivisionKeyboard).toBe(true)
    expect(inst.data.selectedIndex).toBe(2)
  })

  it('onKeyMapping：disorderClick=false 空中间位拦截（键盘仍保持展开）', () => {
    const inst = mountDef(comp.def, {props: {disorderClick: false}})
    inst.setData({showDivisionKeyboard: true})
    inst.methods.onKeyMapping.call(inst, {detail: {index: 3}})
    expect(inst.data.selectedIndex).toBe(0)
    expect(inst.data.showDivisionKeyboard).toBe(true)
  })

  it('onEnter：逐位写入并推进，末位自动 confirm（division 收起键盘）', () => {
    const inst = mountDef(comp.def)
    inst.setData({showDivisionKeyboard: true})
    const input = ['京', 'A', '1', '2', '3', '4', '5', '6']
    input.forEach((ch, i) => {
      inst.methods.onEnter.call(inst, {detail: {value: ch}})
      if (i < 7) expect(inst.data.selectedIndex).toBe(i + 1)
    })
    expect(inst.eventsOf('confirm')).toHaveLength(1)
    expect(inst.eventsOf('confirm')[0].detail).toEqual({value: '京A123456'})
    expect(inst.data.showDivisionKeyboard).toBe(false)
  })

  it('onEnter：value 缺省 → 空串写入（?? 兜底）', () => {
    const inst = mountDef(comp.def)
    inst.methods.onEnter.call(inst, {detail: {}})
    expect(inst.data.keyArray[0]).toBe('')
    expect(inst.data.selectedIndex).toBe(1)
  })

  it('onDelete：清空回退；第 0 位 division 收起键盘', () => {
    const inst = mountDef(comp.def)
    inst.setData({keyArray: applyDefaultValue(emptyKeyArray(), '京A'), selectedIndex: 1})
    inst.methods.onDelete.call(inst)
    expect(inst.data.keyArray[1]).toBe('')
    expect(inst.data.selectedIndex).toBe(0)
    inst.setData({showDivisionKeyboard: true})
    inst.methods.onDelete.call(inst)
    expect(inst.data.showDivisionKeyboard).toBe(false)
  })

  it('onDelete：popUp 模式第 0 位不收起键盘', () => {
    const inst = mountDef(comp.def, {props: {modeShow: 'popUp'}})
    inst.setData({showDivisionKeyboard: true})
    inst.methods.onDelete.call(inst)
    expect(inst.data.showDivisionKeyboard).toBe(true)
  })

  it('onConfirm：popUp 模式不触碰 division 键盘状态，confirm 载荷为拼接串', () => {
    const inst = mountDef(comp.def, {props: {modeShow: 'popUp', defaultValue: '京A123456'}})
    inst.attached()
    inst.setData({showDivisionKeyboard: true})
    inst.methods.onConfirm.call(inst)
    expect(inst.data.showDivisionKeyboard).toBe(true)
    expect(inst.eventsOf('confirm')[0].detail).toEqual({value: '京A123456'})
  })

  it('onTitleBarCancel：popUp 标题栏关闭 → hide 事件', () => {
    const inst = mountDef(comp.def)
    inst.methods.onTitleBarCancel.call(inst)
    expect(inst.eventsOf('hide')).toHaveLength(1)
  })
})
