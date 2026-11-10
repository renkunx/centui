/**
 * icon 逻辑层测试（对照 Vue 版 test/components/icon.spec.ts 行为清单 + 平台映射）：
 * 1. name/color → iconStyle（iconfont：color 内联覆盖，缺省继承父级）
 * 2. 未知图标名告警（经 ICON_MAP 存在性检查）
 * 3. 初始派生（attached 承担，observer 不触发初始值）
 * 4. 点击派发 click
 */
import {describe, expect, it, vi} from 'vitest'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/icon/index'))

describe('icon iconStyle 派生', () => {
  it('已知名 + color：color 内联覆盖', () => {
    const inst = mountDef(comp.def, {props: {name: 'success', color: '#ff6b00'}})
    inst.attached()
    expect(inst.data.iconStyle).toBe('color:#ff6b00;')
  })

  it('已知名无 color：iconStyle 为空（color 继承父级）', () => {
    const inst = mountDef(comp.def, {props: {name: 'spinner'}})
    inst.attached()
    expect(inst.data.iconStyle).toBe('')
  })

  it('未知图标名：console.warn（ICON_MAP 存在性检查）', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const inst = mountDef(comp.def, {props: {name: 'no-such-icon'}})
      inst.attached()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no-such-icon'))
    } finally {
      warn.mockRestore()
    }
  })

  it('name 为空：清空样式', () => {
    const inst = mountDef(comp.def, {props: {name: 'success'}})
    inst.attached()
    inst.setData({name: ''})
    expect(inst.data.iconStyle).toBe('')
  })

  it('observer：运行中改 name/color 重新派生', () => {
    const inst = mountDef(comp.def, {props: {name: 'success'}})
    inst.attached()
    inst.setData({name: 'warn', color: '#01080f'})
    expect(inst.data.iconStyle).toBe('color:#01080f;')
  })
})

describe('icon 事件', () => {
  it('点击派发 click', () => {
    const inst = mountDef(comp.def, {props: {name: 'success'}})
    inst.attached()
    inst.methods.onTap.call(inst)
    expect(inst.eventsOf('click')).toHaveLength(1)
  })
})
