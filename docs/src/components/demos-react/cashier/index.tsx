import { useState } from 'react'
import { MdCashier, MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['收银台']
const code = `<MdCashier value={show} onChange={setShow} channels={channels} paymentAmount="1000.00" />`
const channels = [
  { text: '招商银行储蓄卡', desc: '招商银行(1234)' },
  { text: '支付宝' },
]

export default function CashierDemo() {
  const [show, setShow] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div className="cashier-demo">
          <MdButton type="primary" inline round onClick={() => setShow(true)}>
            打开收银台
          </MdButton>
          <MdCashier
            value={show}
            onChange={v => setShow(v)}
            channels={channels}
            paymentAmount="1000.00"
            title="支付"
            onPay={() => setShow(false)}
          />
        </div>
      )}
    </DemoCanvasReact>
  )
}
