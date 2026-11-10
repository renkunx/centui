/**
 * result-page 逻辑层测试（对照 Vue 版 ResultPage.vue）：
 * 1. actualImgUrl/actualText/actualSubText 默认值链（imgUrl/text/subtext → 内置类型文案）
 * 2. buttonPlain：缺省恒 plain（Vue plain === undefined || plain）
 * 3. buttonsView 预计算（wxml 无法调用函数）
 * 4. onButtonTap：handler 直调（实例注入）→ buttonClick 事件兜底
 */
import {describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef, tapEvent} from '../helpers/weapp'
import {
  actualImgUrl,
  actualSubText,
  actualText,
  buttonPlain,
  IMAGE_INLINE_STYLE,
} from '../../src/components/result-page/logic'

const comp = await loadComponent(() => import('../../src/components/result-page/index'))

describe('result-page 纯逻辑', () => {
  it('actualImgUrl：imgUrl 优先，缺省 https 前缀 + type.png', () => {
    expect(actualImgUrl('https://x/a.png', 'empty')).toBe('https://x/a.png')
    expect(actualImgUrl('', 'network')).toBe(
      'https://manhattan.didistatic.com/static/manhattan/mand-mobile/result-page/2.1/network.png',
    )
  })

  it('actualText：text 优先；network/empty 走 core t() 默认文案；未知类型空串', () => {
    expect(actualText('自定义', 'empty')).toBe('自定义')
    expect(actualText('', 'network')).not.toBe('')
    expect(actualText('', 'empty')).not.toBe('')
    expect(actualText('', 'lost')).toBe('')
  })

  it('actualSubText：subtext 优先；lost 有默认文案', () => {
    expect(actualSubText('说明', 'lost')).toBe('说明')
    expect(actualSubText('', 'lost')).not.toBe('')
    expect(actualSubText('', 'empty')).toBe('')
  })

  it('buttonPlain：undefined 缺省 true；显式 false 保留', () => {
    expect(buttonPlain(undefined)).toBe(true)
    expect(buttonPlain(true)).toBe(true)
    expect(buttonPlain(false)).toBe(false)
  })

  it('IMAGE_INLINE_STYLE 承担 img 标签选择器规则（width 100% + 40rpx 底距）', () => {
    expect(IMAGE_INLINE_STYLE).toBe('width:100%;margin-bottom:40rpx;')
  })
})

describe('result-page 视图预计算', () => {
  it('attached：内置类型填充默认图与文案', () => {
    const inst = mountDef(comp.def, {props: {type: 'empty'}})
    inst.attached()
    expect(inst.data.imgUrlView).toContain('result-page/2.1/empty.png')
    expect(inst.data.imgClass).toBe('empty')
    expect(inst.data.textView).not.toBe('')
    expect(inst.data.imageViewStyle).toBe(IMAGE_INLINE_STYLE)
  })

  it('自定义 text/subtext/imgUrl 覆盖默认', () => {
    const inst = mountDef(comp.def, {
      props: {type: 'network', text: '断网了', subtext: '稍后再试', imgUrl: 'https://x/i.png'},
    })
    inst.attached()
    expect(inst.data.textView).toBe('断网了')
    expect(inst.data.subtextView).toBe('稍后再试')
    expect(inst.data.imgUrlView).toBe('https://x/i.png')
    expect(inst.data.imgClass).toBe('')
  })

  it('buttonsView：plain 缺省 true、type 缺省 default、其余布尔归一', () => {
    const inst = mountDef(comp.def, {
      props: {
        buttons: [
          {text: '主按钮', type: 'primary', plain: false, round: true},
          {text: '次按钮'},
        ],
      },
    })
    inst.attached()
    const view = inst.data.buttonsView as Array<Record<string, unknown>>
    expect(view[0]).toMatchObject({text: '主按钮', type: 'primary', plain: false, round: true})
    expect(view[1]).toMatchObject({text: '次按钮', type: 'default', plain: true, round: false})
  })

  it('observer：buttons 变更重建视图', () => {
    const inst = mountDef(comp.def, {props: {buttons: []}})
    inst.attached()
    inst.setData({buttons: [{text: '新按钮'}]})
    expect((inst.data.buttonsView as unknown[]).length).toBe(1)
  })
})

describe('result-page 按钮点击', () => {
  it('handler 可调用（实例注入）：直调不 emit', () => {
    const handler = vi.fn()
    const inst = mountDef(comp.def, {props: {buttons: [{text: 'b', handler}]}})
    inst.attached()
    inst.methods.onButtonTap.call(inst, tapEvent({index: 0}))
    expect(handler).toHaveBeenCalledTimes(1)
    expect(inst.events).toEqual([])
  })

  it('handler 不可用：buttonClick {index, button} 兜底', () => {
    const button = {text: 'b'}
    const inst = mountDef(comp.def, {props: {buttons: [button]}})
    inst.attached()
    inst.methods.onButtonTap.call(inst, tapEvent({index: 0}))
    expect(inst.eventsOf('buttonClick')).toEqual([
      {name: 'buttonClick', detail: {index: 0, button}},
    ])
  })

  it('越界 index：静默', () => {
    const inst = mountDef(comp.def, {props: {buttons: [{text: 'b'}]}})
    inst.attached()
    expect(() => inst.methods.onButtonTap.call(inst, tapEvent({index: 5}))).not.toThrow()
    expect(inst.events).toEqual([])
  })
})
