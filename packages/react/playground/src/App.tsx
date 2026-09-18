import { useEffect, useRef, useState } from 'react'
import {
  MdActivityIndicator,
  MdAgree,
  MdActionSheet,
  MdAmount,
  MdButton,
  MdCellItem,
  MdCheck,
  MdCheckGroup,
  MdCodebox,
  MdDialog,
  MdField,
  MdIcon,
  MdInputItem,
  MdNoticeBar,
  MdPopup,
  MdPopupTitleBar,
  MdProgress,
  MdRadio,
  MdRadioGroup,
  MdSkeleton,
  MdStepper,
  MdSwitch,
  MdTag,
  MdTip,
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
      <h1>mand-mobile react playground</h1>
      <p className="pg-tip">@mand-mobile/react · 与 Vue 版共享 core 逻辑与 styles 样式</p>

      <section>
        <h2>Button / Icon / Tag</h2>
        <MdButton type="primary">主要按钮</MdButton>
        <MdButton type="warning" plain>次要按钮</MdButton>
        <MdButton type="primary" loading>加载中</MdButton>
        <div className="icons">
          <MdIcon name="home" size="lg" />
          <MdIcon name="success-color" size="lg" />
          <MdIcon name="arrow" />
        </div>
        <div className="tags">
          <MdTag size="tiny" type="fill">标签</MdTag>
          <MdTag size="small" type="ghost">标签</MdTag>
        </div>
      </section>

      <section>
        <h2>Amount / CellItem / NoticeBar</h2>
        <p className="amounts">
          <MdAmount value={1234.56} />
          <MdAmount value={1234.56} hasSeparator />
        </p>
        <MdCellItem title="单元格" brief="描述" addon="内容" arrow />
        <MdNoticeBar mode="closable">为了确保你的资金安全，请设置支付密码</MdNoticeBar>
      </section>

      <section>
        <h2>ActivityIndicator / Progress / Skeleton</h2>
        <div className="indicators">
          <MdActivityIndicator type="roller" />
          <MdActivityIndicator type="spinner" />
          <MdProgress value={progress} />
        </div>
        <MdSkeleton avatar row={2} title />
      </section>

      <section>
        <h2>弹层反馈</h2>
        <div className="popups">
          <MdButton size="small" inline onClick={() => setPopupShow(true)}>底部弹层</MdButton>
          <MdButton size="small" inline onClick={() => setSheetShow(true)}>ActionSheet</MdButton>
          <MdButton size="small" inline onClick={() => setDialogShow(true)}>Dialog</MdButton>
          <MdButton size="small" inline onClick={() => Toast.succeed('操作成功')}>Toast</MdButton>
        </div>
        <MdTip content="点我显示气泡">
          <MdButton size="small" inline>Tip</MdButton>
        </MdTip>
      </section>

      <section>
        <h2>表单</h2>
        <MdField title="结算周期">
          <MdCheckGroup value={checkValues} onChange={setCheckValues}>
            <MdCheck name="day">日结算</MdCheck>
            <MdCheck name="week">周结算</MdCheck>
          </MdCheckGroup>
          <MdRadioGroup value={radioValue} onChange={setRadioValue}>
            <MdRadio name="0" inline>按单</MdRadio>
            <MdRadio name="1" inline>按期</MdRadio>
          </MdRadioGroup>
          <MdInputItem title="姓名" placeholder="请输入" />
          <MdInputItem title="手机号" type="phone" />
          <MdCodebox maxlength={4} value={code} onChange={setCode} isView />
          <div className="forms">
            <MdSwitch value={switchOn} onChange={setSwitchOn} />
            <MdAgree value={agreeOn} onChange={setAgreeOn}>我已阅读并同意协议</MdAgree>
            <MdStepper value={stepperNum} min={0} max={10} onChange={setStepperNum} />
          </div>
        </MdField>
      </section>

      <MdPopup value={popupShow} position="bottom" onChange={setPopupShow}>
        <div className="popup-panel">
          <MdPopupTitleBar title="底部弹层" only-close onCancel={() => setPopupShow(false)} />
          <p style={{ padding: 40, textAlign: 'center' as const }}>弹层内容</p>
        </div>
      </MdPopup>

      <MdActionSheet
        value={sheetShow}
        title="操作弹层"
        options={sheetOptions}
        invalidIndex={2}
        onChange={setSheetShow}
        onSelected={option => Toast.info(`选择了：${option.text}`)}
      />

      <MdDialog
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
