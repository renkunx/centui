/**
 * React 场景库：与 src/vue/scenes.ts 逐页对齐（同 pageId、同 data-e2e 锚点），
 * 供 Playwright 双框架一致性驱动。
 */
import { useRef, useState, type ComponentType } from 'react'
import {
  CuActionBar,
  CuActionSheet,
  CuAgree,
  CuAmount,
  CuBill,
  CuButton,
  CuCashier,
  CuCaptcha,
  CuCellItem,
  CuChart,
  CuCheckList,
  CuCodebox,
  CuDatePicker,
  CuDetailItem,
  CuDialog,
  CuDropMenu,
  CuField,
  CuFieldItem,
  CuIcon,
  CuImageReader,
  CuImageViewer,
  CuInputItem,
  CuLandscape,
  CuLicensePlate,
  CuNoticeBar,
  CuNumberKeyboard,
  CuPicker,
  CuPopup,
  CuPopupTitleBar,
  CuProgress,
  CuRadioList,
  CuResultPage,
  CuRuler,
  CuScrollView,
  CuSelector,
  CuSkeleton,
  CuSlider,
  CuSwitch,
  CuStepper,
  CuSteps,
  CuSwiper,
  CuSwiperItem,
  CuTabPane,
  CuTabPicker,
  CuTabs,
  CuTag,
  CuTextareaItem,
  CuTip,
  CuTransition,
  CuWaterMark,
  Dialog,
  Toast,
  type SwiperExposed,
} from '@centui/react'

const svgPic = (bg: string) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="375" height="300"><rect width="100%" height="100%" fill="${bg}"/><text x="40" y="150" font-size="32" fill="#ffffff">centui-e2e</text></svg>`,
  )

function ButtonPage() {
  const [count, setCount] = useState(0)
  return (
    <>
      <div className="e2e-row">
        <CuButton type="primary">主要按钮</CuButton>
        <CuButton type="warning" plain>
          次要按钮
        </CuButton>
        <CuButton type="primary" round inline size="small">
          圆角小按钮
        </CuButton>
        <CuButton type="primary" loading>
          加载中
        </CuButton>
        <CuButton type="primary" icon="rmb" inline>
          图标按钮
        </CuButton>
        <CuButton type="disabled" disabled>
          禁用按钮
        </CuButton>
        <CuButton type="primary" data-e2e="btn-plain" onClick={() => setCount(c => c + 1)}>
          点了 {count} 次
        </CuButton>
      </div>
      <p className="e2e-state" data-e2e="btn-count">
        {count}
      </p>
    </>
  )
}

function SwitchPage() {
  const [on, setOn] = useState(true)
  return (
    <>
      <div className="e2e-row">
        <div data-e2e="switch">
          <CuSwitch value={on} onChange={setOn} />
        </div>
        <CuSwitch value={false} disabled onChange={() => {}} />
      </div>
      <p className="e2e-state" data-e2e="switch-state">
        {on ? '开' : '关'}
      </p>
    </>
  )
}

function AgreePage() {
  const [checked, setChecked] = useState(true)
  return (
    <>
      <CuAgree value={checked} onChange={setChecked}>
        我已阅读并同意《借款协议》《征信授权书》
      </CuAgree>
      <p className="e2e-state" data-e2e="agree-state">
        {checked ? '已同意' : '未同意'}
      </p>
    </>
  )
}

function StepperPage() {
  const [value, setValue] = useState(3)
  return (
    <>
      <CuField>
        <CuFieldItem title="数量">
          <div data-e2e="stepper">
            <CuStepper value={value} onChange={setValue} min={1} max={5} />
          </div>
        </CuFieldItem>
      </CuField>
      <p className="e2e-state" data-e2e="stepper-state">
        {value}
      </p>
    </>
  )
}

function CheckPage() {
  const [checked, setChecked] = useState<string[]>(['day'])
  const options = [
    { value: 'day', text: '日账单' },
    { value: 'month', text: '月账单' },
  ]
  return (
    <>
      <div data-e2e="check-list">
        <CuCheckList value={checked} onChange={setChecked} options={options} />
      </div>
      <p className="e2e-state" data-e2e="check-state">
        {checked.join(',')}
      </p>
    </>
  )
}

function RadioPage() {
  const [picked, setPicked] = useState('0')
  const options = [
    { value: '0', text: '屏蔽电话' },
    { value: '1', text: '屏蔽短信' },
  ]
  return (
    <>
      <div data-e2e="radio-list">
        <CuRadioList value={picked} onChangeValue={setPicked} options={options} />
      </div>
      <p className="e2e-state" data-e2e="radio-state">
        {picked}
      </p>
    </>
  )
}

function InputPage() {
  const [card, setCard] = useState('6222 0202 0000')
  return (
    <>
      <CuField>
        <CuFieldItem title="卡号" align="right">
          <div data-e2e="input">
            <CuInputItem value={card} onChange={setCard} type="bankCard" placeholder="银行卡号" />
          </div>
        </CuFieldItem>
      </CuField>
      <p className="e2e-state" data-e2e="input-state">
        {card}
      </p>
    </>
  )
}

function CodeboxPage() {
  const [code, setCode] = useState('')
  const [masked, setMasked] = useState('123')
  return (
    <>
      <div className="e2e-col">
        <div data-e2e="codebox">
          <CuCodebox value={code} onChange={setCode} maxlength={4} autofocus={false} system />
        </div>
        <CuCodebox value={masked} onChange={setMasked} maxlength={6} mask autofocus={false} />
      </div>
      <p className="e2e-state" data-e2e="code-state">
        {code}
      </p>
    </>
  )
}

function NumberKeyboardPage() {
  const [show, setShow] = useState(false)
  const [buffer, setBuffer] = useState('')
  return (
    <>
      <CuButton type="primary" data-e2e="kb-open" onClick={() => setShow(s => !s)}>
        {show ? '收起' : '唤起键盘'}
      </CuButton>
      <p className="e2e-state" data-e2e="kb-buffer">
        {buffer}
      </p>
      <CuNumberKeyboard
        value={show}
        onChange={setShow}
        okText="确定"
        onEnter={v => setBuffer(b => b + String(v))}
        onDelete={() => setBuffer(b => b.slice(0, -1))}
      />
    </>
  )
}

function PopupPage() {
  const [show, setShow] = useState(false)
  return (
    <>
      <CuButton type="primary" data-e2e="popup-open" onClick={() => setShow(true)}>
        打开弹层
      </CuButton>
      <p className="e2e-state" data-e2e="popup-state">
        {show ? 'opened' : 'closed'}
      </p>
      <div data-e2e="popup">
        <CuPopup value={show} onChange={setShow} position="bottom">
          <CuPopupTitleBar title="底部弹层" onlyClose onCancel={() => setShow(false)} />
          <p style={{ padding: 40, textAlign: 'center' }}>弹层内容</p>
        </CuPopup>
      </div>
    </>
  )
}

function DialogPage() {
  const [show, setShow] = useState(false)
  const [state, setState] = useState('init')
  return (
    <>
      <div className="e2e-row">
        <CuButton type="primary" data-e2e="dialog-open" onClick={() => setShow(true)}>
          打开对话框
        </CuButton>
        <CuButton data-e2e="dialog-alert" onClick={() => Dialog.alert({ title: '警告', content: '警告弹窗内容' })}>
          单例警告
        </CuButton>
      </div>
      <p className="e2e-state" data-e2e="dialog-state">
        {state}
      </p>
      <CuDialog
        value={show}
        onChange={setShow}
        title="确认操作"
        content="确定要删除该条记录吗？"
        btns={[
          { text: '取消' },
          {
            text: '确定',
            warning: true,
            handler: () => {
              setState('confirmed')
              setShow(false)
            },
          },
        ]}
      />
    </>
  )
}

function ActionSheetPage() {
  const [show, setShow] = useState(false)
  const [state, setState] = useState('init')
  return (
    <>
      <CuButton type="primary" data-e2e="sheet-open" onClick={() => setShow(true)}>
        打开操作弹层
      </CuButton>
      <p className="e2e-state" data-e2e="sheet-state">
        {state}
      </p>
      <CuActionSheet
        value={show}
        onChange={setShow}
        title="操作弹层"
        options={[
          { text: '选项一' },
          { text: '选项二' },
          { text: '禁用项', disabled: true },
        ]}
        invalidIndex={2}
        onSelected={item => setState(item.text)}
        onCancel={() => setState('cancelled')}
      />
    </>
  )
}

function ToastPage() {
  return (
    <div className="e2e-row">
      <CuButton data-e2e="toast-text" onClick={() => Toast.info('一段文字提示')}>
        文字 toast
      </CuButton>
      <CuButton data-e2e="toast-succeed" onClick={() => Toast.succeed('操作成功')}>
        成功 toast
      </CuButton>
      <CuButton data-e2e="toast-hide" onClick={() => Toast.hide()}>
        隐藏 toast
      </CuButton>
    </div>
  )
}

function PickerPage() {
  const [show, setShow] = useState(false)
  const [state, setState] = useState('init')
  return (
    <>
      <CuButton type="primary" data-e2e="picker-open" onClick={() => setShow(true)}>
        打开选择器
      </CuButton>
      <p className="e2e-state" data-e2e="picker-state">
        {state}
      </p>
      <CuPicker
        value={show}
        onChange={setShow}
        data={[[{ text: '浙江', value: 'zj' }, { text: '江苏', value: 'js' }, { text: '广东', value: 'gd' }]]}
        title="选择省份"
        onConfirm={values => setState(values.map(v => v?.text ?? '').join('-'))}
        onCancel={() => setState('cancelled')}
      />
    </>
  )
}

function DatePickerPage() {
  const [show, setShow] = useState(false)
  const [state, setState] = useState('init')
  return (
    <>
      <CuButton type="primary" data-e2e="date-open" onClick={() => setShow(true)}>
        打开日期选择
      </CuButton>
      <p className="e2e-state" data-e2e="date-state">
        {state}
      </p>
      <CuDatePicker
        value={show}
        onChange={setShow}
        type="date"
        title="选择日期"
        onConfirm={values => setState(values.map(v => v?.text ?? '').join('-'))}
      />
    </>
  )
}

function SelectorPage() {
  const [show, setShow] = useState(false)
  const [state, setState] = useState('init')
  const data = [
    { text: '全部', value: 'all' },
    { text: '进行中', value: 'doing' },
    { text: '已完成', value: 'done' },
  ]
  return (
    <>
      <CuButton type="primary" data-e2e="selector-open" onClick={() => setShow(true)}>
        打开筛选器
      </CuButton>
      <p className="e2e-state" data-e2e="selector-state">
        {state}
      </p>
      <CuSelector
        value={show}
        onChange={setShow}
        data={data}
        title="筛选"
        okText="确定"
        onChoose={item => setState(item.text)}
        onConfirm={items => setState('ok:' + items.map(i => i.text).join(','))}
      />
    </>
  )
}

function DropMenuPage() {
  const data = [
    { text: '距离', options: [{ value: '1', text: '1km' }, { value: '2', text: '5km' }] },
    { text: '排序', options: [{ value: 'a', text: '默认' }, { value: 'b', text: '价格' }] },
  ]
  return (
    <div data-e2e="drop-menu">
      <CuDropMenu data={data} defaultValue={['2']} />
      <p className="e2e-state" data-e2e="drop-state">
        init
      </p>
    </div>
  )
}

function TabPickerPage() {
  const [show, setShow] = useState(false)
  const [state, setState] = useState('init')
  const data = {
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
  }
  return (
    <>
      <CuButton type="primary" data-e2e="tabpicker-open" onClick={() => setShow(true)}>
        打开联动选择
      </CuButton>
      <p className="e2e-state" data-e2e="tabpicker-state">
        {state}
      </p>
      <CuTabPicker value={show} onChange={setShow} data={data} title="请选择地区" onChange={v => setState(v.values.join('/'))} />
    </>
  )
}

function CashierPage() {
  const [show, setShow] = useState(false)
  const [state, setState] = useState('init')
  const channels = [
    { icon: 'card-wallet', text: '招商银行储蓄卡', desc: '招商银行(1234)' },
    { icon: 'card-credit', text: '支付宝', desc: '推荐使用' },
  ]
  return (
    <>
      <CuButton type="primary" data-e2e="cashier-open" onClick={() => setShow(true)}>
        打开收银台
      </CuButton>
      <p className="e2e-state" data-e2e="cashier-state">
        {state}
      </p>
      <CuCashier
        value={show}
        onChange={setShow}
        channels={channels}
        paymentAmount="1000.00"
        title="支付"
        onPay={item => setState('pay:' + item.text)}
      />
    </>
  )
}

function TabsPage() {
  const [tab, setTab] = useState('a')
  return (
    <div data-e2e="tabs">
      <CuTabs value={tab} onChange={t => setTab(String((t as { name: string }).name))}>
        <CuTabPane label="第一页" name="a">
          <p className="e2e-state" data-e2e="tab-pane">
            pane-a
          </p>
        </CuTabPane>
        <CuTabPane label="第二页" name="b">
          <p className="e2e-state">pane-b</p>
        </CuTabPane>
        <CuTabPane label="第三页" name="c">
          <p className="e2e-state">pane-c</p>
        </CuTabPane>
      </CuTabs>
    </div>
  )
}

function SwiperPage() {
  const [idx, setIdx] = useState(0)
  const ref = useRef<SwiperExposed>(null)
  return (
    <>
      <div data-e2e="swiper">
        <CuSwiper
          ref={ref}
          autoplay={0}
          onBeforeChange={(_f, to) => setIdx(to)}
          onAfterChange={(_f, to) => setIdx(to)}
        >
          <CuSwiperItem>轮播 1</CuSwiperItem>
          <CuSwiperItem>轮播 2</CuSwiperItem>
          <CuSwiperItem>轮播 3</CuSwiperItem>
        </CuSwiper>
      </div>
      <div className="e2e-row" style={{ marginTop: 12 }}>
        <CuButton size="small" data-e2e="swiper-prev" onClick={() => ref.current?.prev()}>
          上一张
        </CuButton>
        <CuButton size="small" type="primary" data-e2e="swiper-next" onClick={() => ref.current?.next()}>
          下一张
        </CuButton>
      </div>
      <p className="e2e-state" data-e2e="swiper-state">
        {idx}
      </p>
    </>
  )
}

function LicensePlatePage() {
  const [state, setState] = useState('init')
  return (
    <div data-e2e="plate">
      <CuLicensePlate defaultValue="浙AD12345" onConfirm={v => setState(String(v))} />
      <p className="e2e-state" data-e2e="plate-state">
        {state}
      </p>
    </div>
  )
}

function ImageViewerPage() {
  const [show, setShow] = useState(true)
  return (
    <>
      <CuImageViewer value={show} onChange={setShow} list={[svgPic('#2f86f7'), svgPic('#fc9153'), svgPic('#858b9c')]} />
      <CuButton type="primary" data-e2e="viewer-open" onClick={() => setShow(true)}>
        打开图片浏览器
      </CuButton>
    </>
  )
}

function RulerPage() {
  const [value, setValue] = useState(30)
  return (
    <>
      <CuRuler value={value} onChange={setValue} scope={[0, 100]} step={10} unit={10} />
      <p className="e2e-state" data-e2e="ruler-state">
        {value}
      </p>
    </>
  )
}

function CaptchaPage() {
  return (
    <div data-e2e="captcha">
      <CuCaptcha
        isView
        title="输入验证码"
        brief="验证码已发送至 138****1234"
        count={5}
        countNormalText="重新发送"
      />
    </div>
  )
}

export const SCENES: Record<string, ComponentType> = {
  /* ============================ 基础 ============================ */
  button: ButtonPage,
  icon: () => (
    <div className="e2e-row">
      <CuIcon name="home" size="lg" />
      <CuIcon name="location" size="lg" />
      <CuIcon name="arrow" />
      <CuIcon name="success-color" size="lg" />
      <CuIcon name="warning" size="lg" />
      <CuIcon name="rmb" size="lg" />
    </div>
  ),
  tag: () => (
    <div className="e2e-row">
      <CuTag size="tiny" type="fill">
        标签
      </CuTag>
      <CuTag size="small" type="ghost">
        标签
      </CuTag>
      <CuTag shape="fillet" type="fill" fillColor="#fc9153">
        优惠
      </CuTag>
      <CuTag shape="quarter" fillColor="#fc9153">
        首
      </CuTag>
      <CuTag shape="circle" type="ghost" fontColor="#666666">
        圈
      </CuTag>
    </div>
  ),
  amount: () => (
    <div className="e2e-row">
      <CuAmount value={1234.56} />
      <CuAmount value={1234.56} hasSeparator />
      <CuAmount value={1234.56} isCapital />
    </div>
  ),
  'cell-item': () => (
    <>
      <CuCellItem title="单元格" brief="描述文案" addon="内容" arrow />
      <CuCellItem title="无边框" noBorder>
        自定义
      </CuCellItem>
    </>
  ),
  skeleton: () => (
    <div className="e2e-col">
      <CuSkeleton title width="60%" />
      <CuSkeleton avatar title row={2} />
    </div>
  ),
  'notice-bar': () => (
    <>
      <CuNoticeBar mode="closable">为了确保你的资金安全，请设置支付密码</CuNoticeBar>
      <CuNoticeBar mode="link" style={{ marginTop: 12 }}>
        岚迪 6 月账单已出，点击查看
      </CuNoticeBar>
    </>
  ),
  progress: () => <CuProgress value={0.4} />,
  switch: SwitchPage,
  agree: AgreePage,
  stepper: StepperPage,

  /* ============================ 表单 ============================ */
  field: () => (
    <CuField title="表单分组">
      <CuFieldItem title="收件人" placeholder="请输入姓名" />
      <CuFieldItem title="手机号" value="138****1234" align="right" />
      <CuFieldItem title="留言" arrow>
        选填
      </CuFieldItem>
    </CuField>
  ),
  check: CheckPage,
  radio: RadioPage,
  'input-item': InputPage,
  'textarea-item': () => (
    <CuTextareaItem
      value="已经输入的内容"
      onChange={() => {}}
      title="留言"
      placeholder="请输入留言内容…"
      maxLength={50}
      autosize
    />
  ),
  codebox: CodeboxPage,
  'number-keyboard': NumberKeyboardPage,

  /* ============================ 弹层 ============================ */
  popup: PopupPage,
  'popup-title-bar': () => (
    <div className="e2e-col">
      <CuPopupTitleBar title="标题" describe="描述文案" okText="确定" cancelText="取消" />
      <CuPopupTitleBar title="仅关闭" onlyClose largeRadius />
    </div>
  ),
  dialog: DialogPage,
  'action-sheet': ActionSheetPage,
  toast: ToastPage,
  picker: PickerPage,
  'date-picker': DatePickerPage,
  selector: SelectorPage,
  'drop-menu': DropMenuPage,
  'tab-picker': TabPickerPage,
  captcha: CaptchaPage,
  cashier: CashierPage,
  'image-viewer': ImageViewerPage,
  landscape: () => (
    <CuLandscape value fullScreen>
      <div style={{ padding: 40, textAlign: 'center', color: '#ffffff' }}>全屏内容</div>
    </CuLandscape>
  ),

  /* ============================ 展示与滚动 ============================ */
  tabs: TabsPage,
  swiper: SwiperPage,
  slider: () => (
    <>
      <CuSlider value={40} onChange={() => {}} />
    </>
  ),
  'scroll-view': () => (
    <CuScrollView style={{ maxHeight: 200 }}>
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{ padding: '10px 16px', background: '#ffffff' }}>
          列表行 {i + 1}
        </div>
      ))}
    </CuScrollView>
  ),
  'result-page': () => (
    <CuResultPage
      type="network"
      subtext="网络链接异常，请稍后再试"
      buttons={[{ text: '刷新页面', type: 'primary' }]}
      style={{ background: '#ffffff' }}
    />
  ),
  bill: () => (
    <CuBill title="借款账单" no="1234567890" waterMark="centui">
      <CuDetailItem title="借款金额" content="¥ 3,000.00" />
      <CuDetailItem title="借款期数" content="12 期" />
      <CuDetailItem title="借款利率" content="10.8%" bold />
    </CuBill>
  ),
  'water-mark': () => (
    <CuWaterMark content="centui 水印" className="e2e-fill" style={{ minHeight: 160 }}>
      <p>水印内容区域</p>
    </CuWaterMark>
  ),
  chart: () => (
    <CuChart
      labels={['一', '二', '三', '四', '五']}
      datasets={[
        { color: '#5b8ff9', values: [10, 20, 30, 15, 25] },
        { color: '#fa8919', theme: 'region', values: [8, 15, 22, 12, 18] },
      ]}
      size={[300, 220]}
      max={30}
      min={0}
      lines={3}
      step={10}
    />
  ),
  ruler: RulerPage,
  steps: () => (
    <CuSteps
      steps={[
        { name: '申请', desc: '2026-09-30' },
        { name: '审核', desc: '2026-10-01' },
        { name: '放款', desc: '' },
      ]}
      current={1}
    />
  ),
  'action-bar': () => <CuActionBar actions={[{ text: '主要操作', type: 'primary' }]} />,
  'detail-item': () => (
    <div style={{ background: '#ffffff' }}>
      <CuDetailItem title="借款金额" content="¥ 3,000.00" />
      <CuDetailItem title="借款期数" content="12 期" bold />
    </div>
  ),
  tip: () => (
    <div style={{ padding: '24px 0' }}>
      <CuTip content="点击了气泡提示" placement="top">
        <CuButton inline>点击我</CuButton>
      </CuTip>
    </div>
  ),
  'license-plate': LicensePlatePage,
  'image-reader': () => (
    <div className="e2e-row">
      <CuImageReader mime={['png', 'jpeg']} isMultiple />
      <CuButton>上传按钮</CuButton>
    </div>
  ),
  transition: () => (
    <div className="e2e-row" style={{ height: 80, alignItems: 'center' }}>
      <CuTransition name="fade" appear>
        <div style={{ padding: '16px 24px', background: '#2f86f7', color: '#ffffff' }}>渐变内容</div>
      </CuTransition>
    </div>
  ),
}
