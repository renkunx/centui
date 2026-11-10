import {describe, it, expect} from 'vitest'
import {buildNoLabel} from '../../src/components/bill/logic'

describe('bill/logic', () => {
  it('NO. 前缀拼接：string 与 number 一致（对齐 Vue NO.{{ no }}）', () => {
    expect(buildNoLabel('123')).toBe('NO.123')
    expect(buildNoLabel(123)).toBe('NO.123')
  })
})
