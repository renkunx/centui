import {describe, it, expect} from 'vitest'
import {nextChecked, iconNames, iconColors} from '../../src/components/agree/logic'

describe('agree/logic', () => {
  it('disabled 时返回 null（不切换、不 emit），否则取反', () => {
    expect(nextChecked({value: false, disabled: true})).toBeNull()
    expect(nextChecked({value: true, disabled: true})).toBeNull()
    expect(nextChecked({value: false, disabled: false})).toBe(true)
    expect(nextChecked({value: true, disabled: false})).toBe(false)
  })

  it('iconType 分发图标名：circle → checked/check，square → square-checked/square-check', () => {
    expect(iconNames('circle')).toEqual({checked: 'checked', unchecked: 'check'})
    expect(iconNames('square')).toEqual({checked: 'square-checked', unchecked: 'square-check'})
    // 未知值回退 circle（Vue v-else 分支）
    expect(iconNames('')).toEqual({checked: 'checked', unchecked: 'check'})
  })

  it('着色：勾选态 checked 图标为 agree-fill，未勾选透明；check 图标恒为 agree-fill', () => {
    expect(iconColors(true, 'var(--agree-fill)')).toEqual({
      checked: 'var(--agree-fill)',
      unchecked: 'var(--agree-fill)',
    })
    expect(iconColors(false, 'var(--agree-fill)')).toEqual({
      checked: 'transparent',
      unchecked: 'var(--agree-fill)',
    })
  })
})
