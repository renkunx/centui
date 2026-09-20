import { CuWaterMark } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['文字水印', '插槽水印']
const code = `<CuWaterMark content="INTERNAL" opacity={0.08}>
  <p>页面内容</p>
</CuWaterMark></div>
<CuWaterMark spacing={12}>
  <WaterMarkSlot>水印</WaterMarkSlot>
</CuWaterMark></div>`

export default function WaterMarkDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="water-mark-demo-box"><CuWaterMark content="INTERNAL" opacity={0.15}>
              <p className="water-mark-demo-content">页面业务内容</p>
            </CuWaterMark></div>
          )
        return (
          <div className="water-mark-demo-box"><CuWaterMark spacing={12} opacity={0.2} watermark={<span className="water-mark-demo-mark">centui</span>}>
            <p className="water-mark-demo-content">页面业务内容</p>
          </CuWaterMark></div>
        )
      }}
    </DemoCanvasReact>
  )
}
