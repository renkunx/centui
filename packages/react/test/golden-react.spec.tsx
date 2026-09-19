import type { ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { normalizeForCompare, readGolden } from './helpers/golden'
import {
  MdActionSheet,
  MdActivityIndicator,
  MdAgree,
  MdAmount,
  MdButton,
  MdCellItem,
  MdCheckBox,
  MdCheck,
  MdCodebox,
  MdDatePicker,
  MdDialog,
  MdField,
  MdFieldItem,
  MdIcon,
  MdInputItem,
  MdNoticeBar,
  MdNumberKeyboard,
  MdPicker,
  MdPopup,
  MdPopupTitleBar,
  MdProgress,
  MdRadioBox,
  MdRadioList,
  MdRadio,
  MdSkeleton,
  MdStepper,
  MdSwitch,
  MdTag,
  MdScrollView,
  MdScrollViewMore,
  MdScrollViewRefresh,
  MdSlider,
  MdSwiper,
  MdSwiperItem,
  MdToast,
  MdActionBar,
  MdDetailItem,
  MdTextareaItem,
  MdSteps,
  MdTabs,
  MdTabBar,
  MdTabPane,
  MdTransition,
  MdResultPage,
  MdLandscape,
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
    { name: 'default', element: <MdButton>主要按钮</MdButton> },
    { name: 'primary', element: <MdButton type="primary">主要按钮</MdButton> },
    { name: 'disabled', element: <MdButton type="primary" disabled>主要按钮</MdButton> },
    { name: 'round', element: <MdButton type="primary" round>主要按钮</MdButton> },
    { name: 'plain-warn', element: <MdButton type="warning" plain>次要按钮</MdButton> },
  ],
  icon: [
    { name: 'home', element: <MdIcon name="home" /> },
    { name: 'success-lg', element: <MdIcon name="success-color" size="lg" /> },
    { name: 'spinner-svg', element: <MdIcon name="spinner" svg /> },
  ],
  tag: [
    { name: 'fill', element: <MdTag size="tiny" type="fill">标签</MdTag> },
    { name: 'ghost', element: <MdTag size="small" type="ghost">标签</MdTag> },
  ],
  amount: [
    { name: 'default', element: <MdAmount value={1234.56} /> },
    { name: 'uppercase', element: <MdAmount value={1234.56} isCapital /> },
  ],
  'cell-item': [
    { name: 'basic', element: <MdCellItem right="内容" /> },
    { name: 'no-border', element: <MdCellItem noBorder /> },
  ],
  skeleton: [{ name: 'avatar', element: <MdSkeleton avatar loading /> }],
  'notice-bar': [
    {
      name: 'basic',
      element: <MdNoticeBar>为了确保你的资金安全，请设置支付密码</MdNoticeBar>,
    },
    {
      name: 'closable',
      element: <MdNoticeBar mode="closable">为了确保你的资金安全，请设置支付密码</MdNoticeBar>,
    },
  ],
  'activity-indicator': [
    { name: 'roller', element: <MdActivityIndicator type="roller" text="加载中..." /> },
    { name: 'spinner', element: <MdActivityIndicator type="spinner" text="加载中..." /> },
  ],
  progress: [{ name: 'bar', element: <MdProgress value={0.44} /> }],
  switch: [
    { name: 'on', element: <MdSwitch value /> },
    { name: 'off', element: <MdSwitch value={false} /> },
    { name: 'disabled', element: <MdSwitch value disabled /> },
  ],
  agree: [
    { name: 'checked', element: <MdAgree checked>我已阅读并同意协议</MdAgree> },
    { name: 'unchecked', element: <MdAgree>我已阅读并同意协议</MdAgree> },
  ],
  stepper: [
    { name: 'basic', element: <MdStepper value={3} min={0} max={10} /> },
    { name: 'disabled', element: <MdStepper value={3} disabled /> },
  ],
  popup: [
    { name: 'center-open', element: <MdPopup value><p>弹层内容</p></MdPopup> },
    { name: 'bottom-open', element: <MdPopup value position="bottom"><p>底部面板</p></MdPopup> },
    { name: 'no-mask-open', element: <MdPopup value hasMask={false}><p>无遮罩</p></MdPopup> },
  ],
  'popup-title-bar': [
    {
      name: 'ok-cancel',
      element: <MdPopupTitleBar title="标题" okText="确定" cancelText="取消" />,
    },
    {
      name: 'describe-only-close',
      element: <MdPopupTitleBar title="标题" describe="描述文案" onlyClose />,
    },
  ],
  toast: [
    { name: 'closed', element: <MdToast icon="success" content="操作成功" /> },
    { name: 'slot-closed', element: <MdToast><span>自定义</span></MdToast> },
  ],
  dialog: [
    {
      name: 'basic-open',
      element: (
        <MdDialog value appendTo={null} title="对话框标题" content="对话框内容" btns={[{ text: '取消' }, { text: '确定' }]} />
      ),
    },
    {
      name: 'warning-open',
      element: <MdDialog value appendTo={null} title="警告" btns={[{ text: '确定', warning: true }]} />,
    },
  ],
  'action-sheet': [
    {
      name: 'open',
      element: (
        <MdActionSheet
          value
          title="操作弹层"
          options={[{ text: '选项1' }, { text: '选项2' }, { text: '禁用项', disabled: true }]}
          invalidIndex={2}
        />
      ),
    },
  ],
  check: [
    { name: 'checked', element: <MdCheck name="day" value="day">日结算</MdCheck> },
    { name: 'unchecked', element: <MdCheck name="month">月结算</MdCheck> },
    {
      name: 'disabled',
      element: (
        <MdCheck name="day" value="day" disabled>
          日结算
        </MdCheck>
      ),
    },
  ],
  'check-box': [
    { name: 'checked', element: <MdCheckBox {...( { name: 'a', value: ['a'], label: '选项一' } as Record<string, unknown>)} /> },
    { name: 'disabled', element: <MdCheckBox name="b" disabled label="选项二" /> },
  ],
  radio: [
    { name: 'checked', element: <MdRadio name="day" value="day">日结算</MdRadio> },
    { name: 'unchecked-inline', element: <MdRadio name="month" inline>月结算</MdRadio> },
  ],
  'radio-box': [
    { name: 'checked', element: <MdRadioBox name="a" value="a" label="选项一" /> },
  ],
  field: [
    {
      name: 'basic',
      element: (
        <MdField title="标题" brief="描述" action={<a>操作</a>}>
          <div>内容</div>
        </MdField>
      ),
    },
    {
      name: 'plain',
      element: (
        <MdField plain>
          <p>内容</p>
        </MdField>
      ),
    },
  ],
  'field-item': [
    {
      name: 'basic',
      element: <MdFieldItem title="标题" addon="附加" arrow>内容</MdFieldItem>,
    },
    {
      name: 'placeholder',
      element: <MdFieldItem title="标题" placeholder="占位" solid />,
    },
  ],
  'number-keyboard': [
    { name: 'professional-view', element: <MdNumberKeyboard isView value /> },
    { name: 'simple-view', element: <MdNumberKeyboard isView value type="simple" /> },
  ],
  codebox: [
    { name: 'basic', element: <MdCodebox value="12" /> },
    { name: 'mask', element: <MdCodebox value="1234" mask /> },
    { name: 'disabled', element: <MdCodebox value="1" disabled maxlength={4} /> },
  ],
  'input-item': [
    { name: 'basic', element: <MdInputItem title="姓名" placeholder="请输入" /> },
    {
      name: 'phone',
      element: <MdInputItem title="手机号" type="phone" value="13812345678" />,
    },
    {
      name: 'bankcard',
      element: <MdInputItem title="银行卡" type="bankCard" value="6222021234561234" />,
    },
  ],
  'radio-list': [
    {
      name: 'basic',
      element: (
        <MdRadioList
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
        <MdPicker
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
        <MdDatePicker
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
        <MdScrollView>
          <div className="scroll-item">内容一</div>
          <div className="scroll-item">内容二</div>
          <MdScrollViewMore isFinished={false} />
        </MdScrollView>
      ),
    },
    {
      name: 'refresh',
      element: (
        <MdScrollView>
          <MdScrollViewRefresh scrollTop={-30} />
          <div className="scroll-item">内容</div>
        </MdScrollView>
      ),
    },
  ],
  swiper: [
    {
      name: 'three-items',
      element: (
        <MdSwiper>
          <MdSwiperItem><div className="sw-item">第 1 页</div></MdSwiperItem>
          <MdSwiperItem><div className="sw-item">第 2 页</div></MdSwiperItem>
          <MdSwiperItem><div className="sw-item">第 3 页</div></MdSwiperItem>
        </MdSwiper>
      ),
    },
  ],
  slider: [
    { name: 'single', element: <MdSlider value={20} /> },
    { name: 'range', element: <MdSlider value={[20, 80]} range /> },
    { name: 'disabled', element: <MdSlider value={40} disabled /> },
  ],
  'action-bar': [
    { name: 'single', element: <MdActionBar actions={[{ text: '主要按钮' }]} /> },
    {
      name: 'double',
      element: <MdActionBar actions={[{ text: '次要按钮' }, { text: '主要按钮' }]} />,
    },
    {
      name: 'disabled',
      element: <MdActionBar actions={[{ text: '禁用按钮', disabled: true }]} />,
    },
    {
      name: 'with-text',
      element: (
        <MdActionBar actions={[{ text: '主要按钮' }]}>
          <p className="bar-text">合计：¥128.00</p>
        </MdActionBar>
      ),
    },
  ],
  'detail-item': [
    { name: 'basic', element: <MdDetailItem title="标题" content="内容" /> },
    { name: 'bold', element: <MdDetailItem title="标题" content="内容" bold /> },
    { name: 'slot', element: <MdDetailItem title="标题">插槽内容</MdDetailItem> },
  ],
  'textarea-item': [
    { name: 'basic', element: <MdTextareaItem title="标题" placeholder="请输入" /> },
    { name: 'value', element: <MdTextareaItem title="标题" value="预置内容" /> },
    { name: 'clearable', element: <MdTextareaItem title="标题" value="可清除内容" clearable /> },
    { name: 'disabled', element: <MdTextareaItem title="标题" value="禁用内容" disabled /> },
    { name: 'error', element: <MdTextareaItem title="标题" value="出错了" error="错误提示" /> },
    { name: 'rows', element: <MdTextareaItem title="标题" rows={5} placeholder="五行" /> },
  ],
  steps: [
    {
      name: 'horizontal',
      element: <MdSteps steps={[{ name: '第一步' }, { name: '第二步' }, { name: '第三步' }]} current={1} />,
    },
    {
      name: 'with-desc',
      element: (
        <MdSteps
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
        <MdSteps steps={[{ name: '第一步' }, { name: '第二步' }, { name: '第三步' }]} current={1} direction="vertical" />
      ),
    },
    {
      name: 'fraction-current',
      element: <MdSteps steps={[{ name: '第一步' }, { name: '第二步' }]} current={0.5} />,
    },
  ],
  'tab-bar': [
    {
      name: 'items',
      element: (
        <MdTabBar
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
        <MdTabs>
          <MdTabPane label="标签一" name="a">内容一</MdTabPane>
          <MdTabPane label="标签二" name="b">内容二</MdTabPane>
        </MdTabs>
      ),
    },
    {
      name: 'second-active',
      element: (
        <MdTabs value="b">
          <MdTabPane label="标签一" name="a">内容一</MdTabPane>
          <MdTabPane label="标签二" name="b">内容二</MdTabPane>
          <MdTabPane label="标签三" name="c">内容三</MdTabPane>
        </MdTabs>
      ),
    },
    {
      name: 'no-ink',
      element: (
        <MdTabs hasInk={false}>
          <MdTabPane label="标签一" name="a">内容一</MdTabPane>
          <MdTabPane label="标签二" name="b">内容二</MdTabPane>
        </MdTabs>
      ),
    },
  ],
  transition: [
    {
      name: 'fade',
      element: (
        <MdTransition name="md-fade">
          <div className="trans-demo">内容</div>
        </MdTransition>
      ),
    },
    {
      name: 'bounce',
      element: (
        <MdTransition name="md-bounce">
          <div className="trans-demo">内容</div>
        </MdTransition>
      ),
    },
  ],
  'result-page': [
    { name: 'empty', element: <MdResultPage /> },
    { name: 'network', element: <MdResultPage type="network" /> },
    { name: 'lost', element: <MdResultPage type="lost" /> },
    {
      name: 'custom',
      element: (
        <MdResultPage
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
        <MdLandscape>
          <p className="ls-content">横屏内容</p>
        </MdLandscape>
      ),
    },
    {
      name: 'open',
      element: (
        <MdLandscape value>
          <p className="ls-content">横屏内容</p>
        </MdLandscape>
      ),
    },
    {
      name: 'fullscreen',
      element: (
        <MdLandscape value fullScreen>
          <p className="ls-content">横屏内容</p>
        </MdLandscape>
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
