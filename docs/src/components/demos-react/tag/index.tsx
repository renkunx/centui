import { MdTag } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['类型', '形状']
const code = `<MdTag size="tiny" type="fill">标签</MdTag>
<MdTag size="small" type="ghost">标签</MdTag>`

export default function TagDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <div className="tags">
            <MdTag size="tiny" type="fill">标签</MdTag>
            <MdTag size="small" type="ghost">标签</MdTag>
            <MdTag shape="fillet" type="fill" fillColor="#fc9153">优选</MdTag>
          </div>
        ) : (
          <div className="tags">
            <MdTag shape="quarter" fillColor="#fc9153">首</MdTag>
            <MdTag shape="bubble">气泡</MdTag>
            <MdTag shape="coupon" type="fill" fillColor="#fc9153">优惠券</MdTag>
          </div>
        )
      }
    </DemoCanvasReact>
  )
}
