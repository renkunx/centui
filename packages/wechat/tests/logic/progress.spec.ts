import {describe, it, expect} from 'vitest'
import {resolveFormatValue} from '../../src/components/progress/logic'
import {resolveStrokeWidth} from '../../src/shared/indicator-ring'

describe('progress/logic', () => {
  it('未挂载时直接同步终值（对齐 Vue isMounted 首帧语义）', () => {
    expect(
      resolveFormatValue({value: 0.5, oldValue: undefined, isMounted: false, transition: true}),
    ).toEqual({type: 'sync', value: 0.5})
  })

  it('transition=false 直接同步，不动画', () => {
    expect(
      resolveFormatValue({value: 0.8, oldValue: 0.2, isMounted: true, transition: false}),
    ).toEqual({type: 'sync', value: 0.8})
  })

  it('挂载后且 transition=true：从 oldVal 动画到新值（oldVal 缺省按 0）', () => {
    expect(
      resolveFormatValue({value: 0.8, oldValue: 0.2, isMounted: true, transition: true}),
    ).toEqual({type: 'animate', from: 0.2, to: 0.8})
    expect(
      resolveFormatValue({value: 0.8, oldValue: undefined, isMounted: true, transition: true}),
    ).toEqual({type: 'animate', from: 0, to: 0.8})
  })

  it('描边宽缺省换算与 Roller/Progress 链路一致（size/12）', () => {
    expect(resolveStrokeWidth(70, 0)).toBeCloseTo(5.8333, 3)
  })
})
