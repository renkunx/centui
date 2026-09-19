import { MdBill, MdFieldItem, MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础账单', '自定义头部']
const code = `<MdBill title="借款电子凭证" no="12345689" waterMark="mand-mobile">
  <MdFieldItem title="借款金额" content="¥30,000" />
</MdBill>`

export default function BillDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <MdBill title="借款电子凭证" no="12345689" waterMark="mand-mobile">
              <MdFieldItem title="借款金额" content="¥30,000" />
              <MdFieldItem title="收款账户" content="张三" />
              <MdFieldItem title="借款期限" content="12 个月" />
            </MdBill>
          )
        return (
          <MdBill
            header={<div className="bill-demo-header">自定义头部区域</div>}
            footer={<MdButton type="primary" inline round>刷新</MdButton>}
          >
            <p className="bill-demo-text">账单内容</p>
          </MdBill>
        )
      }}
    </DemoCanvasReact>
  )
}
