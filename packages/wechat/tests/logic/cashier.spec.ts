/**
 * cashier 场景状态机与渠道视图测试（对照 Vue 版 Cashier.vue / CashierChannel 系列）。
 */
import {describe, it, expect, vi} from 'vitest'
import {
  buildChannelViews,
  channelCheckIcon,
  isCashierScene,
  isSingleChannel,
  mergeSceneOption,
  resolveSceneActions,
  stripFunctions,
  CASHIER_TEXT,
} from '../../src/components/cashier/logic'

describe('cashier/scene 状态机', () => {
  it('合法场景：choose/captcha/loading/success/fail/custom（CashierScene）', () => {
    for (const scene of ['choose', 'captcha', 'loading', 'success', 'fail', 'custom']) {
      expect(isCashierScene(scene)).toBe(true)
    }
    expect(isCashierScene('unknown')).toBe(false)
  })

  it('mergeSceneOption：Object.assign(target, option) 语义，函数字段不入 data', () => {
    const current = {
      captcha: {text: '', brief: '', maxlength: 4, count: 60, autoCountdown: true},
      loading: {text: '支付结果查询中...'},
    }
    const merged = mergeSceneOption<Record<string, Record<string, unknown>>>(current, 'captcha', {
      brief: '请输入验证码',
      onSend: () => {}, // 函数由实例登记，不入快照
      onNotFunction: 123,
    })
    expect(merged.captcha).toMatchObject({brief: '请输入验证码', text: '', count: 60})
    expect('onSend' in merged.captcha).toBe(false)
    // 其他场景桶不受影响
    expect(merged.loading.text).toBe('支付结果查询中...')
  })

  it('stripFunctions：递归剥离函数（actions 内嵌 handler）', () => {
    const handler = () => {}
    const stripped = stripFunctions({
      text: 'T',
      actions: [{buttonText: 'A', handler}, {buttonText: 'B'}],
      nested: {deep: handler, keep: 1},
    })
    expect(stripped.actions).toEqual([{buttonText: 'A'}, {buttonText: 'B'}])
    expect(stripped.nested).toEqual({keep: 1})
    // 可 JSON 序列化（setData 约束）
    expect(JSON.parse(JSON.stringify(stripped))).toEqual(stripped)
  })
})

describe('cashier/resolveSceneActions（CashierChannelButton actions）', () => {
  it('默认单按钮：sceneOption.buttonText，无 actions 时回退', () => {
    expect(resolveSceneActions({buttonText: '我知道了', handler: null}, '我知道了')).toEqual([
      {buttonText: '我知道了'},
    ])
    expect(resolveSceneActions(undefined, 'fallback')).toEqual([{buttonText: 'fallback'}])
  })

  it('actions 数组覆盖（Vue sceneOption.success.actions || [...]}）', () => {
    const actions = resolveSceneActions(
      {
        actions: [{buttonText: '重试', handler: () => {}}, {buttonText: '返回'}],
        buttonText: '忽略',
      },
      'fallback',
    )
    expect(actions).toEqual([{buttonText: '重试'}, {buttonText: '返回'}])
  })
})

describe('cashier/渠道（CashierChannel 语义）', () => {
  it('isSingleChannel：channelLimit<1 恒单渠道；否则按数量', () => {
    const channels = [{}, {}, {}]
    expect(isSingleChannel(channels, 2)).toBe(false)
    expect(isSingleChannel(channels, 3)).toBe(true)
    expect(isSingleChannel(channels, 1)).toBe(false)
    expect(isSingleChannel(channels, 0)).toBe(true)
    expect(isSingleChannel(channels, -1)).toBe(true)
  })

  it('channelCheckIcon：disabled → check-disabled；active → checked；否则 check', () => {
    expect(channelCheckIcon(true, true)).toBe('check-disabled')
    expect(channelCheckIcon(undefined, true)).toBe('checked')
    expect(channelCheckIcon(false, false)).toBe('check')
  })

  it('buildChannelViews：text/desc/action/check 状态与 active 选中', () => {
    const views = buildChannelViews(
      [
        {text: '微信支付', desc: '推荐', icon: 'wechart'},
        {img: 'https://x/y.png', text: '支付宝', action: {text: '换卡', handler: () => {}}},
        {text: '已停用', disabled: true},
      ],
      1,
    )
    expect(views[0]).toMatchObject({icon: 'wechart', text: '微信支付', desc: '推荐', checkIcon: 'check'})
    expect(views[1]).toMatchObject({img: 'https://x/y.png', actionText: '换卡', checkIcon: 'checked'})
    expect(views[2]).toMatchObject({disabled: true, checkIcon: 'check-disabled'})
  })

  it('locale 默认值（对齐 @centui/core lang/zh-CN md.cashier）', () => {
    expect(CASHIER_TEXT.payCash).toBe('支付金额（元）')
    expect(CASHIER_TEXT.confirmPay).toBe('确定支付')
    expect(CASHIER_TEXT.morePayWays).toBe('更多支付方式')
    expect(CASHIER_TEXT.pay).toBe('支付')
    expect(CASHIER_TEXT.payResultSearch).toBe('支付结果查询中...')
    expect(CASHIER_TEXT.paySuccess).toBe('支付成功')
    expect(CASHIER_TEXT.payFail).toBe('支付失败，请稍后重试')
    expect(CASHIER_TEXT.confirm).toBe('我知道了')
  })
})

/**
 * 组件层（index.ts）：渠道视图派生、显隐事件链、场景状态机 next（captcha/
 * success/fail/loading/custom）、handler 登记（不进 setData）与渠道交互。
 */
import {loadComponent, mountDef, tapEvent} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/cashier/index'))

describe('cashier 组件：渠道视图', () => {
  it('attached：active/default 视图与 isSingle 派生', () => {
    const inst = mountDef(comp.def, {
      props: {
        channels: [{text: '微信支付'}, {text: '支付宝', disabled: true}, {text: '云闪付'}],
        channelLimit: 3,
        defaultIndex: 1,
      },
    })
    inst.attached()
    expect(inst.data.activeChannelIndex).toBe(1)
    expect(inst.data.isSingle).toBe(true) // 3 <= 3
    expect(inst.data.channelViews).toHaveLength(3)
    expect(inst.data.channelViews[1]).toMatchObject({
      text: '支付宝',
      checkIcon: 'check-disabled', // disabled 优先于 active
      disabled: true,
    })
    expect(inst.data.defaultChannelView).toMatchObject({text: '支付宝'})
    // 场景桶默认值（locale 文案）
    expect(inst.data.sceneOption.loading).toEqual({text: '支付结果查询中...'})
    expect(inst.data.sceneOption.success).toMatchObject({text: '支付成功', buttonText: '我知道了'})
    expect(inst.data.sceneOption.captcha.maxlength).toBe(4)
  })

  it('attached：defaultIndex 越界 → defaultChannelView null；channels 含 null 项兜底', () => {
    const inst = mountDef(comp.def, {
      props: {channels: [null as unknown as Record<string, never>], defaultIndex: 5},
    })
    inst.attached()
    expect(inst.data.defaultChannelView).toBeNull()
    // activeChannelIndex = 5（越界）：index 0 非选中 → check
    expect(inst.data.channelViews[0]).toMatchObject({text: '', checkIcon: 'check'})
  })

  it('channels/channelLimit/defaultIndex observers：重派生视图与 isSingle', () => {
    const handler = () => {}
    const inst = mountDef(comp.def, {props: {channels: [{text: 'A'}]}})
    inst.attached()
    inst.setData({channels: [{text: 'B'}, {text: 'C', action: {text: '换卡', handler}}, {text: 'D'}]})
    expect(inst.data.channelViews.map((v: {text: string}) => v.text)).toEqual(['B', 'C', 'D'])
    inst.setData({channelLimit: 2})
    expect(inst.data.isSingle).toBe(false)
    inst.setData({channelLimit: 3})
    expect(inst.data.isSingle).toBe(true)
    inst.setData({defaultIndex: 2})
    expect(inst.data.defaultChannelView).toMatchObject({text: 'D'})
  })

  it('activeChannelIndex observer：视图高亮刷新', () => {
    const inst = mountDef(comp.def, {props: {channels: [{text: 'A'}, {text: 'B'}]}})
    inst.attached()
    inst.setData({activeChannelIndex: 1})
    expect(inst.data.channelViews[1].checkIcon).toBe('checked')
    expect(inst.data.channelViews[0].checkIcon).toBe('check')
  })

  it('渠道 action handler：登记（不进 setData）与触发', () => {
    const handler = vi.fn()
    const inst = mountDef(comp.def, {
      props: {channels: [{text: 'A', action: {text: '换卡', handler}}]},
    })
    inst.attached()
    expect(inst.data.channelViews[0].actionText).toBe('换卡')
    expect(typeof (inst.data.channelViews[0] as Record<string, unknown>).handler).toBe('undefined')
    inst.methods.onChannelActionTap.call(inst, tapEvent({index: 0}))
    expect(handler).toHaveBeenCalledTimes(1)
    inst.methods.onChannelActionTap.call(inst, tapEvent({index: 9})) // 未登记
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('onChannelItemClick：禁用/缺失阻断；命中 → active + select 事件', () => {
    const inst = mountDef(comp.def, {
      props: {channels: [{text: 'A'}, {text: 'B', disabled: true}]},
    })
    inst.attached()
    inst.methods.onChannelItemClick.call(inst, tapEvent({index: 1}))
    inst.methods.onChannelItemClick.call(inst, tapEvent({index: 9}))
    expect(inst.events).toEqual([])
    inst.methods.onChannelItemClick.call(inst, tapEvent({index: 0}))
    expect(inst.data.activeChannelIndex).toBe(0)
    expect(inst.eventsOf('select')[0].detail).toEqual({item: {text: 'A'}, index: 0})
  })

  it('onChannelMoreClick：展开更多；微任务后置 active，再点幂等', async () => {
    const inst = mountDef(comp.def)
    inst.methods.onChannelMoreClick.call(inst)
    expect(inst.data.isChannelShow).toBe(true)
    await Promise.resolve()
    expect(inst.data.isChannelActive).toBe(true)
    inst.methods.onChannelMoreClick.call(inst)
    expect(inst.data.isChannelShow).toBe(true)
  })

  it('onChannelBtnClick：pay 载荷 {item}（activeChannelIndex 越界 → undefined）', () => {
    const inst = mountDef(comp.def, {props: {channels: [{text: 'A'}], defaultIndex: 0}})
    inst.attached()
    inst.methods.onChannelBtnClick.call(inst)
    expect(inst.eventsOf('pay')[0].detail).toEqual({item: {text: 'A'}})

    const empty = mountDef(comp.def)
    empty.attached()
    empty.methods.onChannelBtnClick.call(empty)
    expect(empty.eventsOf('pay')[0].detail).toEqual({item: undefined})
  })
})

describe('cashier 组件：显隐与 popup 转发', () => {
  it('show/hide 一等 API 与 innerShow observer 的 change 事件', () => {
    const inst = mountDef(comp.def)
    inst.methods.show.call(inst)
    expect(inst.data.innerShow).toBe(true)
    expect(inst.eventsOf('change')[0].detail).toEqual({value: true})
    inst.methods.hide.call(inst)
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change')[1].detail).toEqual({value: false})
  })

  it('popup change/show/hide/cancel 链路；hide 重置场景回 choose', () => {
    const inst = mountDef(comp.def)
    inst.methods.onPopupChange.call(inst, {detail: {value: true}})
    expect(inst.eventsOf('change')).toHaveLength(0) // value=true 忽略

    inst.setData({show: true}) // show observer → innerShow → change 事件
    expect(inst.data.innerShow).toBe(true)
    expect(inst.eventsOf('change')[0].detail).toEqual({value: true})
    inst.methods.onPopupShow.call(inst)
    expect(inst.eventsOf('show')).toHaveLength(1)

    inst.methods.next.call(inst, 'loading')
    inst.methods.onPopupHide.call(inst)
    expect(inst.data.scene).toBe('choose')
    expect(inst.data.sceneKey).toBeGreaterThan(0)
    expect(inst.eventsOf('hide')).toHaveLength(1)

    inst.methods.onPopupCancel.call(inst)
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('cancel')).toHaveLength(1)

    inst.methods.onPopupChange.call(inst, {detail: {value: false}})
    expect(inst.data.innerShow).toBe(false)
    expect(inst.eventsOf('change').length).toBeGreaterThanOrEqual(2)
  })
})

describe('cashier 组件：场景状态机 next', () => {
  it('next(loading)：场景与默认文案', () => {
    const inst = mountDef(comp.def)
    inst.methods.next.call(inst, 'loading')
    expect(inst.data.scene).toBe('loading')
    expect(inst.data.sceneOption.loading).toEqual({text: '支付结果查询中...'})
  })

  it('next(captcha)：序列化字段并入 + onSend/onSubmit 登记触发', () => {
    const onSend = vi.fn()
    const onSubmit = vi.fn()
    const inst = mountDef(comp.def)
    inst.methods.next.call(inst, 'captcha', {
      text: '请输入验证码',
      maxlength: 6,
      onSend,
      onSubmit,
    })
    expect(inst.data.scene).toBe('captcha')
    expect(inst.data.sceneOption.captcha).toMatchObject({text: '请输入验证码', maxlength: 6, count: 60})
    // handler 函数不进 setData
    expect((inst.data.sceneOption.captcha as Record<string, unknown>).onSend).toBeUndefined()

    inst.methods.onSceneSend.call(inst)
    expect(onSend).toHaveBeenCalledTimes(1)
    inst.methods.onSceneSubmit.call(inst, {detail: {value: '8888'}})
    expect(onSubmit).toHaveBeenCalledWith('8888')
  })

  it('next(success)：actions 数组归一化 + handler 逐项登记与触发', () => {
    const h0 = vi.fn()
    const inst = mountDef(comp.def)
    inst.methods.next.call(inst, 'success', {
      actions: [{buttonText: '重试', handler: h0}, {buttonText: '返回', handler: null}],
    })
    expect(inst.data.scene).toBe('success')
    expect(inst.data.successActions).toEqual([{buttonText: '重试'}, {buttonText: '返回'}])
    inst.methods.onSceneActionTap.call(inst, tapEvent({scene: 'success', index: 0}))
    expect(h0).toHaveBeenCalledTimes(1)
    inst.methods.onSceneActionTap.call(inst, tapEvent({scene: 'success', index: 1})) // null handler
    expect(h0).toHaveBeenCalledTimes(1)
  })

  it('next(fail)：handler 单按钮归一化，缺省文案回退「我知道了」', () => {
    const fh = vi.fn()
    const inst = mountDef(comp.def)
    inst.methods.next.call(inst, 'fail', {handler: fh})
    expect(inst.data.failActions).toEqual([{buttonText: '我知道了'}])
    inst.methods.onSceneActionTap.call(inst, tapEvent({scene: 'fail', index: 0}))
    expect(fh).toHaveBeenCalledTimes(1)
  })

  it('next(success) 无 actions：无 handler → 空登记；buttonText 自定义', () => {
    const inst = mountDef(comp.def)
    inst.methods.next.call(inst, 'success', {})
    expect(inst.data.successActions).toEqual([{buttonText: '我知道了'}])
    inst.methods.next.call(inst, 'success', {buttonText: '好的'})
    expect(inst.data.successActions).toEqual([{buttonText: '好的'}])
    inst.methods.onSceneActionTap.call(inst, tapEvent({scene: 'success', index: 0})) // 无登记
  })

  it('next(custom)：场景键与透传字段', () => {
    const inst = mountDef(comp.def)
    inst.methods.next.call(inst, 'custom', {foo: 'bar'})
    expect(inst.data.scene).toBe('custom')
    expect(inst.data.sceneOption.custom).toMatchObject({foo: 'bar'})
  })

  it('未登记 captcha 回调时 onSceneSend/onSceneSubmit 安全；noop 可调', () => {
    const inst = mountDef(comp.def)
    expect(() => {
      inst.methods.onSceneSend.call(inst)
      inst.methods.onSceneSubmit.call(inst, {detail: {value: '1'}})
      inst.methods.noop.call(inst)
    }).not.toThrow()
  })
})

describe('cashier 组件：兜底分支', () => {
  it('channels 为 null：attached 与 observer 均回退空表', () => {
    const inst = mountDef(comp.def, {props: {channels: null}})
    inst.attached()
    expect(inst.data.isSingle).toBe(true)
    expect(inst.data.channelViews).toEqual([])
    inst.setData({channels: null})
    expect(inst.data.channelViews).toEqual([])
  })

  it('next(fail) actions 数组；next(success) handler 单回调（含 null）', () => {
    const h = vi.fn()
    const inst = mountDef(comp.def)
    inst.methods.next.call(inst, 'fail', {actions: [{buttonText: '重试', handler: h}]})
    expect(inst.data.failActions).toEqual([{buttonText: '重试'}])
    inst.methods.onSceneActionTap.call(inst, tapEvent({scene: 'fail', index: 0}))
    expect(h).toHaveBeenCalledTimes(1)

    inst.methods.next.call(inst, 'success', {handler: h})
    inst.methods.onSceneActionTap.call(inst, tapEvent({scene: 'success', index: 0}))
    expect(h).toHaveBeenCalledTimes(2)

    // handler: null → ?? null 兜底；fail 无 actions/handler → 空登记
    const inst2 = mountDef(comp.def)
    inst2.methods.next.call(inst2, 'success', {handler: null})
    inst2.methods.next.call(inst2, 'fail', {})
    inst2.methods.onSceneActionTap.call(inst2, tapEvent({scene: 'success', index: 0}))
    inst2.methods.onSceneActionTap.call(inst2, tapEvent({scene: 'fail', index: 0}))
  })

  it('next(captcha) 无回调：登记分支跳过，onSceneSend/onSceneSubmit 空转', () => {
    const inst = mountDef(comp.def)
    inst.methods.next.call(inst, 'captcha', {text: 'x'})
    expect(() => {
      inst.methods.onSceneSend.call(inst)
      inst.methods.onSceneSubmit.call(inst, {detail: {value: '1'}})
    }).not.toThrow()
  })
})
