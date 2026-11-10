/* legacy/components/steps/demo 对译（TODO 已清零；差异见 wxml 尾注释） */

Page({
  data: {
    // demo0/demo1：登录/注册 → 申请征信报告 → 提取征信报告
    stepsD0: [{name: '登录/注册'}, {name: '申请征信报告'}, {name: '提取征信报告'}],
    // demo2~6：登录/开通/验证/成功
    stepsD2: [{name: '登录'}, {name: '开通'}, {name: '验证'}, {name: '成功'}],
    // demo4 进度变化动效（legacy 初始 0，triggerSteps0 置 2）
    currentStep4: 0,
    // demo5 利用 current 类加样式
    currentStep5: 1,
    // demo6 完成全部步骤
    currentStep6: 4,
    // demo7 纵向展示
    stepsD7: [
      {name: '登录', text: '这是登录的描述'},
      {name: '开通', text: '这是开通的描述'},
      {name: '验证', text: '这是验证的描述'},
      {name: '成功', text: '这是成功的描述'},
    ],
    // demo8 自定义内容（legacy v-html 描述，span 高亮改为内联样式交 rich-text 渲染）
    steps8a: [{name: '还款申请已提交', amount: '600.5', text: ''}, {name: '还款成功'}],
    steps8aText:
      '银行处理中，预计<span style="color:#FF8325">30分钟</span>内到账，请留意短信信息。如有疑问，请联系客服。',
    steps8b: [{name: '还款申请已提交'}, {name: '还款成功', amount: '600.5'}],
    // 自定义树内 cu-icon 的 active 色（组件默认 success 图标同款色）
    stepsActiveColor: 'var(--steps-color-active)',
  },

  // legacy window.triggerSteps0
  triggerSteps0() {
    this.setData({currentStep4: 2})
  },
})
