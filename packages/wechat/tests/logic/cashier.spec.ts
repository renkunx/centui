/**
 * cashier 场景状态机与渠道视图测试（对照 Vue 版 Cashier.vue / CashierChannel 系列）。
 */
import {describe, it, expect} from 'vitest'
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
