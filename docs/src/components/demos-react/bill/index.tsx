import { CuBill, CuFieldItem, CuButton } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础账单', '自定义头部']
const code = `<CuBill title="借款电子凭证" no="12345689" waterMark="centui">
  <CuFieldItem title="借款金额" content="¥30,000" />
</CuBill>`

export default function BillDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <CuBill title="借款电子凭证" no="12345689" waterMark="centui">
              <CuFieldItem title="借款金额" content="¥30,000" />
              <CuFieldItem title="收款账户" content="张三" />
              <CuFieldItem title="借款期限" content="12 个月" />
            </CuBill>
          )
        return (
          <CuBill
            header={<div className="bill-demo-header">自定义头部区域</div>}
            footer={<CuButton type="primary" inline round>刷新</CuButton>}
          >
            <p className="bill-demo-text">账单内容</p>
          </CuBill>
        )
      }}
    </DemoCanvasReact>
  )
}
