import { useEffect, useRef, useState } from 'react'
import {
  CuActivityIndicator,
  CuAgree,
  CuActionSheet,
  CuAmount,
  CuButton,
  CuCellItem,
  CuCheck,
  CuCheckGroup,
  CuCodebox,
  CuDialog,
  CuField,
  CuIcon,
  CuInputItem,
  CuNoticeBar,
  CuPopup,
  CuPopupTitleBar,
  CuProgress,
  CuRadio,
  CuRadioGroup,
  CuSkeleton,
  CuStepper,
  CuSwitch,
  CuTag,
  CuTip,
  Toast,
  type ActionSheetOption,
} from '../../src'

function App() {
  const [popupShow, setPopupShow] = useState(false)
  const [sheetShow, setSheetShow] = useState(false)
  const [dialogShow, setDialogShow] = useState(false)
  const [checkValues, setCheckValues] = useState<Array<string | number | boolean>>(['day'])
  const [radioValue, setRadioValue] = useState<string | number | boolean>('0')
  const [switchOn, setSwitchOn] = useState(true)
  const [agreeOn, setAgreeOn] = useState(false)
  const [stepperNum, setStepperNum] = useState(3)
  const [code, setCode] = useState('')
  const [progress, setProgress] = useState(0.2)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    progressRef.current = setInterval(() => {
      setProgress(p => Math.round(((p + 0.1) % 1.1) * 100) / 100)
    }, 800)
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current)
      }
    }
  }, [])

  const sheetOptions: ActionSheetOption[] = [
    { text: '选项一' },
    { text: '选项二' },
    { text: '禁用项' },
  ]

  return (
    <div className="pg">
      <h1>centui react playground</h1>
      <p className="pg-tip">@centui/react · 与 Vue 版共享 core 逻辑与 styles 样式</p>

      <section>
        <h2>Button / Icon / Tag</h2>
        <CuButton type="primary">主要按钮</CuButton>
        <CuButton type="warning" plain>次要按钮</CuButton>
        <CuButton type="primary" loading>加载中</CuButton>
        <div className="icons">
          <CuIcon name="home" size="lg" />
          <CuIcon name="success-color" size="lg" />
          <CuIcon name="arrow" />
        </div>
        <div className="tags">
          <CuTag size="tiny" type="fill">标签</CuTag>
          <CuTag size="small" type="ghost">标签</CuTag>
        </div>
      </section>

      <section>
        <h2>Amount / CellItem / NoticeBar</h2>
        <p className="amounts">
          <CuAmount value={1234.56} />
          <CuAmount value={1234.56} hasSeparator />
        </p>
        <CuCellItem title="单元格" brief="描述" addon="内容" arrow />
        <CuNoticeBar mode="closable">为了确保你的资金安全，请设置支付密码</CuNoticeBar>
      </section>

      <section>
        <h2>ActivityIndicator / Progress / Skeleton</h2>
        <div className="indicators">
          <CuActivityIndicator type="roller" />
          <CuActivityIndicator type="spinner" />
          <CuProgress value={progress} />
        </div>
        <CuSkeleton avatar row={2} title />
      </section>

      <section>
        <h2>弹层反馈</h2>
        <div className="popups">
          <CuButton size="small" inline onClick={() => setPopupShow(true)}>底部弹层</CuButton>
          <CuButton size="small" inline onClick={() => setSheetShow(true)}>ActionSheet</CuButton>
          <CuButton size="small" inline onClick={() => setDialogShow(true)}>Dialog</CuButton>
          <CuButton size="small" inline onClick={() => Toast.succeed('操作成功')}>Toast</CuButton>
        </div>
        <CuTip content="点我显示气泡">
          <CuButton size="small" inline>Tip</CuButton>
        </CuTip>
      </section>

      <section>
        <h2>表单</h2>
        <CuField title="结算周期">
          <CuCheckGroup value={checkValues} onChange={setCheckValues}>
            <CuCheck name="day">日结算</CuCheck>
            <CuCheck name="week">周结算</CuCheck>
          </CuCheckGroup>
          <CuRadioGroup value={radioValue} onChange={setRadioValue}>
            <CuRadio name="0" inline>按单</CuRadio>
            <CuRadio name="1" inline>按期</CuRadio>
          </CuRadioGroup>
          <CuInputItem title="姓名" placeholder="请输入" />
          <CuInputItem title="手机号" type="phone" />
          <CuCodebox maxlength={4} value={code} onChange={setCode} isView />
          <div className="forms">
            <CuSwitch value={switchOn} onChange={setSwitchOn} />
            <CuAgree value={agreeOn} onChange={setAgreeOn}>我已阅读并同意协议</CuAgree>
            <CuStepper value={stepperNum} min={0} max={10} onChange={setStepperNum} />
          </div>
        </CuField>
      </section>

      <CuPopup value={popupShow} position="bottom" onChange={setPopupShow}>
        <div className="popup-panel">
          <CuPopupTitleBar title="底部弹层" only-close onCancel={() => setPopupShow(false)} />
          <p style={{ padding: 40, textAlign: 'center' as const }}>弹层内容</p>
        </div>
      </CuPopup>

      <CuActionSheet
        value={sheetShow}
        title="操作弹层"
        options={sheetOptions}
        invalidIndex={2}
        onChange={setSheetShow}
        onSelected={option => Toast.info(`选择了：${option.text}`)}
      />

      <CuDialog
        value={dialogShow}
        title="对话框"
        content="这是一个 React 对话框"
        btns={[
          { text: '取消', handler: () => setDialogShow(false) },
          { text: '确定', handler: () => setDialogShow(false) },
        ]}
        onChange={setDialogShow}
      />
    </div>
  )
}

export default App
