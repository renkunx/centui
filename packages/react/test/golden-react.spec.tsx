import type { ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { normalizeForCompare, readGolden } from './helpers/golden'
import {
  CuActionSheet,
  CuActivityIndicator,
  CuAgree,
  CuAmount,
  CuButton,
  CuCellItem,
  CuCheckBox,
  CuCheck,
  CuCodebox,
  CuDatePicker,
  CuDialog,
  CuField,
  CuFieldItem,
  CuIcon,
  CuInputItem,
  CuNoticeBar,
  CuNumberKeyboard,
  CuPicker,
  CuPopup,
  CuPopupTitleBar,
  CuProgress,
  CuRadioBox,
  CuRadioList,
  CuRadio,
  CuSkeleton,
  CuStepper,
  CuSwitch,
  CuTag,
  CuScrollView,
  CuScrollViewMore,
  CuScrollViewRefresh,
  CuSlider,
  CuSwiper,
  CuSwiperItem,
  CuToast,
  CuActionBar,
  CuDetailItem,
  CuTextareaItem,
  CuSteps,
  CuTabs,
  CuTabBar,
  CuTabPane,
  CuTransition,
  CuResultPage,
  CuLandscape,
  CuSelector,
  CuDropMenu,
  CuCaptcha,
  CuChart,
  CuImageReader,
  CuLicensePlate,
  CuCashier,
} from '../src'

/**
 * L3 渲染契约：React 组件与 test/golden 产出的 v2 基线（mand-mobile@2.7.0）逐场景对比。
 * 基线捕获的是「初始提交 DOM」（VTU v1 挂载后未等异步刷新），
 * React 侧以 flushSync 同步渲染后立即读取 innerHTML，passive effects 尚未执行，
 * 两侧行为语义一致（弹层未开、滚轮未定位、键盘未初始化）。
 */
export async function renderToHTML(element: ReactElement): Promise<string> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  let root: Root | null = createRoot(container)
  try {
    flushSync(() => {
      root!.render(element)
    })
    // 基线已改为「落定态」采集（flush 渲染队列 + 定时器初始化），React 侧同样 settle
    await new Promise(r => setTimeout(r, 30))
    return container.innerHTML
  } finally {
    const rootRef = root
    root = null
    setTimeout(() => {
      rootRef.unmount()
      container.remove()
    }, 0)
  }
}

interface Scenario {
  name: string
  element: ReactElement
}

const scenarios: Record<string, Scenario[]> = {
  button: [
    { name: 'default', element: <CuButton>主要按钮</CuButton> },
    { name: 'primary', element: <CuButton type="primary">主要按钮</CuButton> },
    { name: 'disabled', element: <CuButton type="primary" disabled>主要按钮</CuButton> },
    { name: 'round', element: <CuButton type="primary" round>主要按钮</CuButton> },
    { name: 'plain-warn', element: <CuButton type="warning" plain>次要按钮</CuButton> },
  ],
  icon: [
    { name: 'home', element: <CuIcon name="home" /> },
    { name: 'success-lg', element: <CuIcon name="success-color" size="lg" /> },
    { name: 'spinner-svg', element: <CuIcon name="spinner" svg /> },
  ],
  tag: [
    { name: 'fill', element: <CuTag size="tiny" type="fill">标签</CuTag> },
    { name: 'ghost', element: <CuTag size="small" type="ghost">标签</CuTag> },
  ],
  amount: [
    { name: 'default', element: <CuAmount value={1234.56} /> },
    { name: 'uppercase', element: <CuAmount value={1234.56} isCapital /> },
  ],
  'cell-item': [
    { name: 'basic', element: <CuCellItem right="内容" /> },
    { name: 'no-border', element: <CuCellItem noBorder /> },
  ],
  skeleton: [{ name: 'avatar', element: <CuSkeleton avatar loading /> }],
  'notice-bar': [
    {
      name: 'basic',
      element: <CuNoticeBar>为了确保你的资金安全，请设置支付密码</CuNoticeBar>,
    },
    {
      name: 'closable',
      element: <CuNoticeBar mode="closable">为了确保你的资金安全，请设置支付密码</CuNoticeBar>,
    },
  ],
  'activity-indicator': [
    { name: 'roller', element: <CuActivityIndicator type="roller" text="加载中..." /> },
    { name: 'spinner', element: <CuActivityIndicator type="spinner" text="加载中..." /> },
  ],
  progress: [{ name: 'bar', element: <CuProgress value={0.44} /> }],
  switch: [
    { name: 'on', element: <CuSwitch value /> },
    { name: 'off', element: <CuSwitch value={false} /> },
    { name: 'disabled', element: <CuSwitch value disabled /> },
  ],
  agree: [
    { name: 'checked', element: <CuAgree checked>我已阅读并同意协议</CuAgree> },
    { name: 'unchecked', element: <CuAgree>我已阅读并同意协议</CuAgree> },
  ],
  stepper: [
    { name: 'basic', element: <CuStepper value={3} min={0} max={10} /> },
    { name: 'disabled', element: <CuStepper value={3} disabled /> },
  ],
  popup: [
    { name: 'center-open', element: <CuPopup value><p>弹层内容</p></CuPopup> },
    { name: 'bottom-open', element: <CuPopup value position="bottom"><p>底部面板</p></CuPopup> },
    { name: 'no-mask-open', element: <CuPopup value hasMask={false}><p>无遮罩</p></CuPopup> },
  ],
  'popup-title-bar': [
    {
      name: 'ok-cancel',
      element: <CuPopupTitleBar title="标题" okText="确定" cancelText="取消" />,
    },
    {
      name: 'describe-only-close',
      element: <CuPopupTitleBar title="标题" describe="描述文案" onlyClose />,
    },
  ],
  toast: [
    { name: 'closed', element: <CuToast icon="success" content="操作成功" /> },
    { name: 'slot-closed', element: <CuToast><span>自定义</span></CuToast> },
  ],
  dialog: [
    {
      name: 'basic-open',
      element: (
        <CuDialog value appendTo={null} title="对话框标题" content="对话框内容" btns={[{ text: '取消' }, { text: '确定' }]} />
      ),
    },
    {
      name: 'warning-open',
      element: <CuDialog value appendTo={null} title="警告" btns={[{ text: '确定', warning: true }]} />,
    },
  ],
  'action-sheet': [
    {
      name: 'open',
      element: (
        <CuActionSheet
          value
          title="操作弹层"
          options={[{ text: '选项1' }, { text: '选项2' }, { text: '禁用项', disabled: true }]}
          invalidIndex={2}
        />
      ),
    },
  ],
  check: [
    { name: 'checked', element: <CuCheck name="day" value="day">日结算</CuCheck> },
    { name: 'unchecked', element: <CuCheck name="month">月结算</CuCheck> },
    {
      name: 'disabled',
      element: (
        <CuCheck name="day" value="day" disabled>
          日结算
        </CuCheck>
      ),
    },
  ],
  'check-box': [
    { name: 'checked', element: <CuCheckBox {...( { name: 'a', value: ['a'], label: '选项一' } as Record<string, unknown>)} /> },
    { name: 'disabled', element: <CuCheckBox name="b" disabled label="选项二" /> },
  ],
  radio: [
    { name: 'checked', element: <CuRadio name="day" value="day">日结算</CuRadio> },
    { name: 'unchecked-inline', element: <CuRadio name="month" inline>月结算</CuRadio> },
  ],
  'radio-box': [
    { name: 'checked', element: <CuRadioBox name="a" value="a" label="选项一" /> },
  ],
  field: [
    {
      name: 'basic',
      element: (
        <CuField title="标题" brief="描述" action={<a>操作</a>}>
          <div>内容</div>
        </CuField>
      ),
    },
    {
      name: 'plain',
      element: (
        <CuField plain>
          <p>内容</p>
        </CuField>
      ),
    },
  ],
  'field-item': [
    {
      name: 'basic',
      element: <CuFieldItem title="标题" addon="附加" arrow>内容</CuFieldItem>,
    },
    {
      name: 'placeholder',
      element: <CuFieldItem title="标题" placeholder="占位" solid />,
    },
  ],
  'number-keyboard': [
    { name: 'professional-view', element: <CuNumberKeyboard isView value /> },
    { name: 'simple-view', element: <CuNumberKeyboard isView value type="simple" /> },
  ],
  codebox: [
    { name: 'basic', element: <CuCodebox value="12" /> },
    { name: 'mask', element: <CuCodebox value="1234" mask /> },
    { name: 'disabled', element: <CuCodebox value="1" disabled maxlength={4} /> },
  ],
  'input-item': [
    { name: 'basic', element: <CuInputItem title="姓名" placeholder="请输入" /> },
    {
      name: 'phone',
      element: <CuInputItem title="手机号" type="phone" value="13812345678" />,
    },
    {
      name: 'bankcard',
      element: <CuInputItem title="银行卡" type="bankCard" value="6222021234561234" />,
    },
  ],
  'radio-list': [
    {
      name: 'basic',
      element: (
        <CuRadioList
          value="a"
          options={[{ value: 'a', text: '选项一' }, { value: 'b', text: '选项二' }]}
        />
      ),
    },
  ],
  picker: [
    {
      name: 'view',
      element: (
        <CuPicker
          isView
          cols={2}
          data={[
            [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
            [{ text: '1' }, { text: '2' }],
          ]}
          defaultValue={['B', '2']}
        />
      ),
    },
  ],
  'date-picker': [
    {
      name: 'view',
      element: (
        <CuDatePicker
          isView
          type="date"
          defaultDate={new Date(2024, 5, 15)}
          minDate={new Date(2020, 0, 1)}
          maxDate={new Date(2025, 11, 31)}
        />
      ),
    },
  ],
  'scroll-view': [
    {
      name: 'basic',
      element: (
        <CuScrollView>
          <div className="scroll-item">内容一</div>
          <div className="scroll-item">内容二</div>
          <CuScrollViewMore isFinished={false} />
        </CuScrollView>
      ),
    },
    {
      name: 'refresh',
      element: (
        <CuScrollView>
          <CuScrollViewRefresh scrollTop={-30} />
          <div className="scroll-item">内容</div>
        </CuScrollView>
      ),
    },
  ],
  swiper: [
    {
      name: 'three-items',
      element: (
        <CuSwiper>
          <CuSwiperItem><div className="sw-item">第 1 页</div></CuSwiperItem>
          <CuSwiperItem><div className="sw-item">第 2 页</div></CuSwiperItem>
          <CuSwiperItem><div className="sw-item">第 3 页</div></CuSwiperItem>
        </CuSwiper>
      ),
    },
  ],
  slider: [
    { name: 'single', element: <CuSlider value={20} /> },
    { name: 'range', element: <CuSlider value={[20, 80]} range /> },
    { name: 'disabled', element: <CuSlider value={40} disabled /> },
  ],
  'action-bar': [
    { name: 'single', element: <CuActionBar actions={[{ text: '主要按钮' }]} /> },
    {
      name: 'double',
      element: <CuActionBar actions={[{ text: '次要按钮' }, { text: '主要按钮' }]} />,
    },
    {
      name: 'disabled',
      element: <CuActionBar actions={[{ text: '禁用按钮', disabled: true }]} />,
    },
    {
      name: 'with-text',
      element: (
        <CuActionBar actions={[{ text: '主要按钮' }]}>
          <p className="bar-text">合计：¥128.00</p>
        </CuActionBar>
      ),
    },
  ],
  'detail-item': [
    { name: 'basic', element: <CuDetailItem title="标题" content="内容" /> },
    { name: 'bold', element: <CuDetailItem title="标题" content="内容" bold /> },
    { name: 'slot', element: <CuDetailItem title="标题">插槽内容</CuDetailItem> },
  ],
  'textarea-item': [
    { name: 'basic', element: <CuTextareaItem title="标题" placeholder="请输入" /> },
    { name: 'value', element: <CuTextareaItem title="标题" value="预置内容" /> },
    { name: 'clearable', element: <CuTextareaItem title="标题" value="可清除内容" clearable /> },
    { name: 'disabled', element: <CuTextareaItem title="标题" value="禁用内容" disabled /> },
    { name: 'error', element: <CuTextareaItem title="标题" value="出错了" error="错误提示" /> },
    { name: 'rows', element: <CuTextareaItem title="标题" rows={5} placeholder="五行" /> },
  ],
  steps: [
    {
      name: 'horizontal',
      element: <CuSteps steps={[{ name: '第一步' }, { name: '第二步' }, { name: '第三步' }]} current={1} />,
    },
    {
      name: 'with-desc',
      element: (
        <CuSteps
          steps={[
            { name: '下单', text: '2016-12-12' },
            { name: '付款', text: '2016-12-13' },
            { name: '发货', text: '2016-12-14' },
          ]}
          current={2}
        />
      ),
    },
    {
      name: 'vertical',
      element: (
        <CuSteps steps={[{ name: '第一步' }, { name: '第二步' }, { name: '第三步' }]} current={1} direction="vertical" />
      ),
    },
    {
      name: 'fraction-current',
      element: <CuSteps steps={[{ name: '第一步' }, { name: '第二步' }]} current={0.5} />,
    },
  ],
  'tab-bar': [
    {
      name: 'items',
      element: (
        <CuTabBar
          items={[
            { name: 'a', label: '第一项' },
            { name: 'b', label: '第二项' },
            { name: 'c', label: '第三项' },
          ]}
        />
      ),
    },
  ],
  tabs: [
    {
      name: 'basic',
      element: (
        <CuTabs>
          <CuTabPane label="标签一" name="a">内容一</CuTabPane>
          <CuTabPane label="标签二" name="b">内容二</CuTabPane>
        </CuTabs>
      ),
    },
    {
      name: 'second-active',
      element: (
        <CuTabs value="b">
          <CuTabPane label="标签一" name="a">内容一</CuTabPane>
          <CuTabPane label="标签二" name="b">内容二</CuTabPane>
          <CuTabPane label="标签三" name="c">内容三</CuTabPane>
        </CuTabs>
      ),
    },
    {
      name: 'no-ink',
      element: (
        <CuTabs hasInk={false}>
          <CuTabPane label="标签一" name="a">内容一</CuTabPane>
          <CuTabPane label="标签二" name="b">内容二</CuTabPane>
        </CuTabs>
      ),
    },
  ],
  transition: [
    {
      name: 'fade',
      element: (
        <CuTransition name="cu-fade">
          <div className="trans-demo">内容</div>
        </CuTransition>
      ),
    },
    {
      name: 'bounce',
      element: (
        <CuTransition name="cu-bounce">
          <div className="trans-demo">内容</div>
        </CuTransition>
      ),
    },
  ],
  'result-page': [
    { name: 'empty', element: <CuResultPage /> },
    { name: 'network', element: <CuResultPage type="network" /> },
    { name: 'lost', element: <CuResultPage type="lost" /> },
    {
      name: 'custom',
      element: (
        <CuResultPage
          imgUrl="https://example.com/a.png"
          text="自定义标题"
          subtext="自定义描述"
          buttons={[{ text: '主要按钮' }, { text: '次要按钮', plain: false }]}
        />
      ),
    },
  ],
  landscape: [
    {
      name: 'closed',
      element: (
        <CuLandscape>
          <p className="ls-content">横屏内容</p>
        </CuLandscape>
      ),
    },
    {
      name: 'open',
      element: (
        <CuLandscape value>
          <p className="ls-content">横屏内容</p>
        </CuLandscape>
      ),
    },
    {
      name: 'fullscreen',
      element: (
        <CuLandscape value fullScreen>
          <p className="ls-content">横屏内容</p>
        </CuLandscape>
      ),
    },
  ],
  selector: [
    { name: 'closed', element: <CuSelector data={[]} /> },
    {
      name: 'open',
      element: (
        <CuSelector
          value
          title="选择地区"
          data={[
            { value: '1', text: '选项一' },
            { value: '2', text: '选项二' },
            { value: '3', text: '选项三' },
          ]}
          defaultValue="2"
        />
      ),
    },
    {
      name: 'multi-check',
      element: (
        <CuSelector
          value
          multi
          title="多选"
          okText="确定"
          data={[
            { value: 'a', text: '选项 A' },
            { value: 'b', text: '选项 B' },
          ]}
          defaultValue={['a']}
        />
      ),
    },
  ],
  'drop-menu': [
    {
      name: 'bar',
      element: (
        <CuDropMenu
          data={[
            { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }] },
            { text: '排序', options: [{ value: '3', text: '默认' }, { value: '4', text: '价格' }] },
            { text: '禁用项', disabled: true, options: [] },
          ]}
          defaultValue={['2']}
        />
      ),
    },
  ],
  captcha: [
    {
      name: 'inline',
      element: (
        <CuCaptcha
          isView
          title="输入验证码"
          brief="验证码已发送至 138****1234"
          maxlength={4}
        >
          短信验证码已发送
        </CuCaptcha>
      ),
    },
  ],
  chart: [
    {
      name: 'basic',
      element: (
        <CuChart
          labels={['周一', '周二', '周三', '周四', '周五', '周六', '周日']}
          datasets={[{ color: '#5b8ff9', width: 1, values: [120, 350, 420, 260, 180, 300, 450] }]}
          size={[480, 270]}
          max={500}
          min={0}
          lines={5}
          step={100}
        />
      ),
    },
    {
      name: 'region',
      element: (
        <CuChart
          labels={['1', '2', '3', '4']}
          datasets={[{ color: '#fa8919', theme: 'region', width: 1, values: [100, 200, 150, 300] }]}
          size={[480, 270]}
          max={300}
          min={0}
          lines={4}
          step={75}
        />
      ),
    },
  ],
  'image-reader': [
    { name: 'default', element: <CuImageReader /> },
  ],
  'license-plate': [
    { name: 'division', element: <CuLicensePlate defaultValue="浙AD12345" /> },
  ],
  cashier: [
    {
      name: 'choose',
      element: (
        <CuCashier
          value
          title="支付"
          paymentAmount="1000.00"
          channels={[
            { text: '招商银行储蓄卡', desc: '招商银行(1234)' },
            { text: '支付宝', img: 'https://img.alipay.com/static/img/alipay.png' },
          ]}
        />
      ),
    },
  ],
}

describe('L3 golden 对比（React 渲染 vs v2 基线）', () => {
  for (const [component, list] of Object.entries(scenarios)) {
    describe(component, () => {
      for (const scenario of list) {
        it(scenario.name, async () => {
          const actual = normalizeForCompare(await renderToHTML(scenario.element))
          const baseline = normalizeForCompare(readGolden(component, scenario.name))
          expect(actual).toBe(baseline)
        })
      }
    })
  }
})
