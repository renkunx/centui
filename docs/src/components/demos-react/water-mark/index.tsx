import { MdWaterMark } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['文字水印', '插槽水印']
const code = `<MdWaterMark content="INTERNAL" opacity={0.08}>
  <p>页面内容</p>
</MdWaterMark></div>
<MdWaterMark spacing={12}>
  <WaterMarkSlot>水印</WaterMarkSlot>
</MdWaterMark></div>`

export default function WaterMarkDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="water-mark-demo-box"><MdWaterMark content="INTERNAL" opacity={0.15}>
              <p className="water-mark-demo-content">页面业务内容</p>
            </MdWaterMark></div>
          )
        return (
          <div className="water-mark-demo-box"><MdWaterMark spacing={12} opacity={0.2} watermark={<span className="water-mark-demo-mark">mand-mobile</span>}>
            <p className="water-mark-demo-content">页面业务内容</p>
          </MdWaterMark></div>
        )
      }}
    </DemoCanvasReact>
  )
}
