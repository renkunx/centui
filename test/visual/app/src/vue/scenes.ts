/**
 * Vue 3 场景库：每页一个组件的代表性场景堆叠。
 * - Cu* 组件由 main.ts 全局注册，内联 template 直接解析
 * - data-e2e-* 锚点供 Playwright 交互定位
 * - .e2e-state 反映交互结果，供断言
 */
import { defineComponent, ref } from 'vue'
import { Dialog, Toast } from 'centui'

/** 场景页 = 内联模板 + setup 局部状态 */
function page(template: string, setup?: () => Record<string, unknown>) {
  return defineComponent({
    name: 'e2e-page',
    setup: setup ?? (() => ({})),
    template,
  })
}

export const SCENES: Record<string, ReturnType<typeof page>> = {
  /* ============================ 基础 ============================ */
  button: page(
    `
    <div class="e2e-row">
      <CuButton type="primary">主要按钮</CuButton>
      <CuButton type="warning" plain>次要按钮</CuButton>
      <CuButton type="primary" round inline size="small">圆角小按钮</CuButton>
      <CuButton type="primary" loading>加载中</CuButton>
      <CuButton type="primary" icon="rmb" inline>图标按钮</CuButton>
      <CuButton type="disabled" disabled>禁用按钮</CuButton>
      <CuButton type="primary" data-e2e="btn-plain" @click="count++">点了 {{ count }} 次</CuButton>
    </div>
    <p class="e2e-state" data-e2e="btn-count">{{ count }}</p>
    `,
    () => ({ count: ref(0) }),
  ),

  icon: page(
    `
    <div class="e2e-row">
      <CuIcon name="home" size="lg" />
      <CuIcon name="location" size="lg" />
      <CuIcon name="arrow" />
      <CuIcon name="success-color" size="lg" />
      <CuIcon name="warning" size="lg" />
      <CuIcon name="rmb" size="lg" />
    </div>
    `,
  ),

  tag: page(
    `
    <div class="e2e-row">
      <CuTag size="tiny" type="fill">标签</CuTag>
      <CuTag size="small" type="ghost">标签</CuTag>
      <CuTag shape="fillet" type="fill" fill-color="#fc9153">优惠</CuTag>
      <CuTag shape="quarter" fill-color="#fc9153">首</CuTag>
      <CuTag shape="circle" type="ghost" font-color="#666666">圈</CuTag>
    </div>
    `,
  ),

  amount: page(
    `
    <div class="e2e-row">
      <CuAmount :value="1234.56" />
      <CuAmount :value="1234.56" has-separator />
      <CuAmount :value="1234.56" is-capital />
    </div>
    `,
  ),

  'cell-item': page(
    `
    <CuCellItem title="单元格" brief="描述文案" addon="内容" arrow />
    <CuCellItem title="无边框" no-border>
      <template #right>自定义</template>
    </CuCellItem>
    `,
  ),

  skeleton: page(
    `
    <div class="e2e-col">
      <CuSkeleton title width="60%" />
      <CuSkeleton avatar title :row="2" />
    </div>
    `,
  ),

  'notice-bar': page(
    `
    <CuNoticeBar mode="closable">为了确保你的资金安全，请设置支付密码</CuNoticeBar>
    <CuNoticeBar mode="link" style="margin-top:12px">岚迪 6 月账单已出，点击查看</CuNoticeBar>
    `,
  ),

  progress: page(`<CuProgress :value="0.4" />`),

  switch: page(
    `
    <div class="e2e-row">
      <CuSwitch v-model="on" data-e2e="switch" />
      <CuSwitch v-model="offDisabled" disabled />
    </div>
    <p class="e2e-state" data-e2e="switch-state">{{ on ? '开' : '关' }}</p>
    `,
    () => ({ on: ref(true), offDisabled: ref(false) }),
  ),

  agree: page(
    `
    <CuAgree v-model="checked">我已阅读并同意《借款协议》《征信授权书》</CuAgree>
    <p class="e2e-state" data-e2e="agree-state">{{ checked ? '已同意' : '未同意' }}</p>
    `,
    () => ({ checked: ref(true) }),
  ),

  stepper: page(
    `
    <CuField>
      <CuFieldItem title="数量">
        <CuStepper v-model="value" :min="1" :max="5" data-e2e="stepper" />
      </CuFieldItem>
    </CuField>
    <p class="e2e-state" data-e2e="stepper-state">{{ value }}</p>
    `,
    () => ({ value: ref(3) }),
  ),

  /* ============================ 表单 ============================ */
  field: page(
    `
    <CuField title="表单分组">
      <CuFieldItem title="收件人" placeholder="请输入姓名" />
      <CuFieldItem title="手机号" value="138****1234" align="right" />
      <CuFieldItem title="留言" arrow>
        <template #right>选填</template>
      </CuFieldItem>
    </CuField>
    `,
  ),

  check: page(
    `
    <CuCheckList v-model="checked" :options="options" data-e2e="check-list" />
    <p class="e2e-state" data-e2e="check-state">{{ checked.join(',') }}</p>
    `,
    () => ({
      checked: ref(['day']),
      options: [
        { value: 'day', text: '日账单' },
        { value: 'month', text: '月账单' },
      ],
    }),
  ),

  radio: page(
    `
    <CuRadioList v-model="picked" :options="options" data-e2e="radio-list" />
    <p class="e2e-state" data-e2e="radio-state">{{ picked }}</p>
    `,
    () => ({
      picked: ref('0'),
      options: [
        { value: '0', text: '屏蔽电话' },
        { value: '1', text: '屏蔽短信' },
      ],
    }),
  ),

  'input-item': page(
    `
    <CuField>
      <CuFieldItem title="卡号" align="right">
        <CuInputItem v-model="card" type="bankCard" placeholder="银行卡号" data-e2e="input" />
      </CuFieldItem>
    </CuField>
    <p class="e2e-state" data-e2e="input-state">{{ card }}</p>
    `,
    () => ({ card: ref('6222 0202 0000') }),
  ),

  'textarea-item': page(
    `
    <CuTextareaItem v-model="text" title="留言" placeholder="请输入留言内容…" :max-length="50" autosize />
    `,
    () => ({ text: ref('已经输入的内容') }),
  ),

  codebox: page(
    `
    <div class="e2e-col">
      <CuCodebox v-model="code" :maxlength="4" :autofocus="false" system data-e2e="codebox" />
      <CuCodebox v-model="masked" :maxlength="6" mask :autofocus="false" />
    </div>
    <p class="e2e-state" data-e2e="code-state">{{ code }}</p>
    `,
    () => ({ code: ref(''), masked: ref('123') }),
  ),

  'number-keyboard': page(
    `
    <CuButton type="primary" data-e2e="kb-open" @click="show = !show">{{ show ? '收起' : '唤起键盘' }}</CuButton>
    <p class="e2e-state" data-e2e="kb-buffer">{{ buffer }}</p>
    <CuNumberKeyboard v-model="show" ok-text="确定" @enter="onEnter" @delete="onDelete" />
    `,
    () => {
      const show = ref(false)
      const buffer = ref('')
      return {
        show,
        buffer,
        onEnter: (v: string | number) => (buffer.value += String(v)),
        onDelete: () => (buffer.value = buffer.value.slice(0, -1)),
      }
    },
  ),

  /* ============================ 弹层 ============================ */
  popup: page(
    `
    <CuButton type="primary" data-e2e="popup-open" @click="show = true">打开弹层</CuButton>
    <p class="e2e-state" data-e2e="popup-state">{{ show ? 'opened' : 'closed' }}</p>
    <CuPopup v-model="show" position="bottom" data-e2e="popup">
      <CuPopupTitleBar title="底部弹层" only-close @cancel="show = false" />
      <p style="padding:40px;text-align:center">弹层内容</p>
    </CuPopup>
    `,
    () => ({ show: ref(false) }),
  ),

  'popup-title-bar': page(
    `
    <div class="e2e-col">
      <CuPopupTitleBar title="标题" describe="描述文案" ok-text="确定" cancel-text="取消" />
      <CuPopupTitleBar title="仅关闭" only-close large-radius />
    </div>
    `,
  ),

  dialog: page(
    `
    <div class="e2e-row">
      <CuButton type="primary" data-e2e="dialog-open" @click="show = true">打开对话框</CuButton>
      <CuButton data-e2e="dialog-alert" @click="alert">单例警告</CuButton>
    </div>
    <p class="e2e-state" data-e2e="dialog-state">{{ state }}</p>
    <CuDialog
      v-model="show"
      title="确认操作"
      content="确定要删除该条记录吗？"
      :btns="[{ text: '取消' }, { text: '确定', warning: true, handler: onOk }]"
    />
    `,
    () => {
      const show = ref(false)
      const state = ref('init')
      return {
        show,
        state,
        onOk: () => {
          state.value = 'confirmed'
          show.value = false
        },
        alert: () => Dialog.alert({ title: '警告', content: '警告弹窗内容' }),
      }
    },
  ),

  'action-sheet': page(
    `
    <CuButton type="primary" data-e2e="sheet-open" @click="show = true">打开操作弹层</CuButton>
    <p class="e2e-state" data-e2e="sheet-state">{{ state }}</p>
    <CuActionSheet
      v-model="show"
      title="操作弹层"
      :options="[{ text: '选项一' }, { text: '选项二' }, { text: '禁用项', disabled: true }]"
      :invalid-index="2"
      @selected="onSelected"
      @cancel="onCancel"
    />
    `,
    () => {
      const show = ref(false)
      const state = ref('init')
      return {
        show,
        state,
        onSelected: (item: { text: string }) => (state.value = item.text),
        onCancel: () => (state.value = 'cancelled'),
      }
    },
  ),

  toast: page(
    `
    <div class="e2e-row">
      <CuButton data-e2e="toast-text" @click="Toast.info('一段文字提示')">文字 toast</CuButton>
      <CuButton data-e2e="toast-succeed" @click="Toast.succeed('操作成功')">成功 toast</CuButton>
      <CuButton data-e2e="toast-hide" @click="Toast.hide()">隐藏 toast</CuButton>
    </div>
    `,
    () => ({ Toast }),
  ),

  picker: page(
    `
    <CuButton type="primary" data-e2e="picker-open" @click="show = true">打开选择器</CuButton>
    <p class="e2e-state" data-e2e="picker-state">{{ state }}</p>
    <CuPicker
      v-model="show"
      :data="pickerData"
      title="选择省份"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
    `,
    () => {
      const show = ref(false)
      const state = ref('init')
      return {
        show,
        state,
        pickerData: [[{ text: '浙江', value: 'zj' }, { text: '江苏', value: 'js' }, { text: '广东', value: 'gd' }]],
        onConfirm: (values: Array<{ text: string }>) => (state.value = values.map(v => v.text).join('-')),
        onCancel: () => (state.value = 'cancelled'),
      }
    },
  ),

  'date-picker': page(
    `
    <CuButton type="primary" data-e2e="date-open" @click="show = true">打开日期选择</CuButton>
    <p class="e2e-state" data-e2e="date-state">{{ state }}</p>
    <CuDatePicker
      v-model="show"
      type="date"
      title="选择日期"
      @confirm="onConfirm"
    />
    `,
    () => {
      const show = ref(false)
      const state = ref('init')
      return {
        show,
        state,
        onConfirm: (values: Array<{ text: string }>) => (state.value = values.map(v => v?.text ?? '').join('-')),
      }
    },
  ),

  selector: page(
    `
    <CuButton type="primary" data-e2e="selector-open" @click="show = true">打开筛选器</CuButton>
    <p class="e2e-state" data-e2e="selector-state">{{ state }}</p>
    <CuSelector
      v-model="show"
      :data="data"
      title="筛选"
      ok-text="确定"
      @choose="onChoose"
      @confirm="onConfirm"
    />
    `,
    () => {
      const show = ref(false)
      const state = ref('init')
      return {
        show,
        state,
        data: [
          { text: '全部', value: 'all' },
          { text: '进行中', value: 'doing' },
          { text: '已完成', value: 'done' },
        ],
        onChoose: (item: { text: string }) => (state.value = item.text),
        onConfirm: (items: Array<{ text: string }>) => (state.value = 'ok:' + items.map(i => i.text).join(',')),
      }
    },
  ),

  'drop-menu': page(
    `
    <CuDropMenu :data="data" :default-value="['2']" data-e2e="drop-menu" />
    <p class="e2e-state" data-e2e="drop-state">init</p>
    `,
    () => ({
      data: [
        { text: '距离', options: [{ value: '1', text: '1km' }, { value: '2', text: '5km' }] },
        { text: '排序', options: [{ value: 'a', text: '默认' }, { value: 'b', text: '价格' }] },
      ],
    }),
  ),

  'tab-picker': page(
    `
    <CuButton type="primary" data-e2e="tabpicker-open" @click="show = true">打开联动选择</CuButton>
    <p class="e2e-state" data-e2e="tabpicker-state">{{ state }}</p>
    <CuTabPicker v-model="show" :data="data" title="请选择地区" @change="onChange" />
    `,
    () => {
      const show = ref(false)
      const state = ref('init')
      return {
        show,
        state,
        data: {
          name: 'province',
          label: '省份',
          options: [
            {
              value: 'zj',
              label: '浙江',
              children: {
                name: 'city',
                label: '城市',
                options: [
                  { value: 'hz', label: '杭州' },
                  { value: 'nb', label: '宁波' },
                ],
              },
            },
            { value: 'js', label: '江苏' },
          ],
        },
        onChange: ({ values }: { values: Array<string> }) => (state.value = values.join('/')),
      }
    },
  ),

  captcha: page(
    `
    <CuCaptcha
      is-view
      title="输入验证码"
      brief="验证码已发送至 138****1234"
      :count="5"
      count-normal-text="重新发送"
      data-e2e="captcha"
    />
    `,
  ),

  cashier: page(
    `
    <CuButton type="primary" data-e2e="cashier-open" @click="show = true">打开收银台</CuButton>
    <p class="e2e-state" data-e2e="cashier-state">{{ state }}</p>
    <CuCashier
      v-model="show"
      :channels="channels"
      payment-amount="1000.00"
      title="支付"
      @pay="onPay"
    />
    `,
    () => {
      const show = ref(false)
      const state = ref('init')
      return {
        show,
        state,
        channels: [
          { icon: 'card-wallet', text: '招商银行储蓄卡', desc: '招商银行(1234)' },
          { icon: 'card-credit', text: '支付宝', desc: '推荐使用' },
        ],
        onPay: (item: { text: string }) => (state.value = 'pay:' + item.text),
      }
    },
  ),

  'image-viewer': page(
    `
    <CuImageViewer v-model="show" :list="list" />
    <CuButton type="primary" data-e2e="viewer-open" @click="show = true">打开图片浏览器</CuButton>
    `,
    () => {
      const show = ref(true)
      const svg = (bg: string) =>
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="375" height="300"><rect width="100%" height="100%" fill="${bg}"/><text x="40" y="150" font-size="32" fill="#ffffff">centui-e2e</text></svg>`,
        )
      return { show, list: [svg('#2f86f7'), svg('#fc9153'), svg('#858b9c')] }
    },
  ),

  landscape: page(
    `
    <CuLandscape v-model="show">
      <div style="padding:40px;text-align:center;color:#ffffff">全屏内容</div>
    </CuLandscape>
    `,
    () => ({ show: ref(true) }),
  ),

  /* ============================ 展示与滚动 ============================ */
  tabs: page(
    `
    <CuTabs v-model="tab" data-e2e="tabs">
      <CuTabPane label="第一页" name="a">
        <p class="e2e-state" data-e2e="tab-pane">pane-a</p>
      </CuTabPane>
      <CuTabPane label="第二页" name="b">
        <p class="e2e-state">pane-b</p>
      </CuTabPane>
      <CuTabPane label="第三页" name="c">
        <p class="e2e-state">pane-c</p>
      </CuTabPane>
    </CuTabs>
    `,
    () => ({ tab: ref('a') }),
  ),

  swiper: page(
    `
    <CuSwiper :autoplay="0" ref="swiper" data-e2e="swiper" @after-change="onChange">
      <CuSwiperItem>轮播 1</CuSwiperItem>
      <CuSwiperItem>轮播 2</CuSwiperItem>
      <CuSwiperItem>轮播 3</CuSwiperItem>
    </CuSwiper>
    <div class="e2e-row" style="margin-top:12px">
      <CuButton size="small" data-e2e="swiper-prev" @click="call('prev')">上一张</CuButton>
      <CuButton size="small" type="primary" data-e2e="swiper-next" @click="call('next')">下一张</CuButton>
    </div>
    <p class="e2e-state" data-e2e="swiper-state">{{ idx }}</p>
    `,
    () => {
      const swiper = ref<{ next: () => void; prev: () => void } | null>(null)
      const idx = ref(0)
      return {
        swiper,
        idx,
        onChange: (_from: number, to: number) => (idx.value = to),
        call: (method: 'next' | 'prev') => swiper.value?.[method](),
      }
    },
  ),

  slider: page(
    `
    <CuSlider v-model="value" />
    <p class="e2e-state">{{ value }}</p>
    `,
    () => ({ value: ref(40) }),
  ),

  'scroll-view': page(
    `
    <CuScrollView style="max-height:200px">
      <div v-for="i in 20" :key="i" style="padding:10px 16px;background:#ffffff">
        列表行 {{ i }}
      </div>
    </CuScrollView>
    `,
  ),

  'result-page': page(
    `
    <CuResultPage
      type="network"
      subtext="网络链接异常，请稍后再试"
      :buttons="[{ text: '刷新页面', type: 'primary' }]"
      style="background:#ffffff"
    />
    `,
  ),

  bill: page(
    `
    <CuBill title="借款账单" no="1234567890" water-mark="centui">
      <CuDetailItem title="借款金额" content="¥ 3,000.00" />
      <CuDetailItem title="借款期数" content="12 期" />
      <CuDetailItem title="借款利率" content="10.8%" bold />
    </CuBill>
    `,
  ),

  'water-mark': page(
    `
    <CuWaterMark content="centui 水印" class="e2e-fill" style="min-height:160px">
      <p>水印内容区域</p>
    </CuWaterMark>
    `,
  ),

  chart: page(
    `
    <CuChart :labels="labels" :datasets="datasets" :size="[300, 220]" :max="30" :min="0" :lines="3" :step="10" />
    `,
    () => ({
      labels: ['一', '二', '三', '四', '五'],
      datasets: [
        { color: '#5b8ff9', values: [10, 20, 30, 15, 25] },
        { color: '#fa8919', theme: 'region', values: [8, 15, 22, 12, 18] },
      ],
    }),
  ),

  ruler: page(
    `
    <CuRuler v-model="value" :scope="[0, 100]" :step="10" :unit="10" />
    <p class="e2e-state" data-e2e="ruler-state">{{ value }}</p>
    `,
    () => ({ value: ref(30) }),
  ),

  steps: page(
    `
    <CuSteps :steps="steps" :current="1" />
    `,
    () => ({
      steps: [
        { name: '申请', desc: '2026-09-30' },
        { name: '审核', desc: '2026-10-01' },
        { name: '放款', desc: '' },
      ],
    }),
  ),

  'action-bar': page(
    `
    <CuActionBar :actions="[{ text: '主要操作', type: 'primary' }]" />
    `,
  ),

  'detail-item': page(
    `
    <div style="background:#ffffff">
      <CuDetailItem title="借款金额" content="¥ 3,000.00" />
      <CuDetailItem title="借款期数" content="12 期" bold />
    </div>
    `,
  ),

  tip: page(
    `
    <div style="padding:24px 0">
      <CuTip content="点击了气泡提示" placement="top">
        <CuButton inline>点击我</CuButton>
      </CuTip>
    </div>
    `,
  ),

  'license-plate': page(
    `
    <CuLicensePlate default-value="浙AD12345" @confirm="state = $event" data-e2e="plate" />
    <p class="e2e-state" data-e2e="plate-state">{{ state }}</p>
    `,
    () => ({ state: ref('init') }),
  ),

  'image-reader': page(
    `
    <div class="e2e-row">
      <CuImageReader :mime="['png', 'jpeg']" is-multiple />
      <CuButton>上传按钮</CuButton>
    </div>
    `,
  ),

  transition: page(
    `
    <div class="e2e-row" style="height:80px;align-items:center">
      <CuTransition name="fade" appear>
        <div style="padding:16px 24px;background:#2f86f7;color:#ffffff">渐变内容</div>
      </CuTransition>
    </div>
    `,
  ),
}
