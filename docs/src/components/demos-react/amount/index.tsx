import { MdAmount } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['常规', '千分位', '大写']
const code = `<MdAmount :value="1234.56" />
<MdAmount :value="1234.56" has-separator />
<MdAmount :value="1234.56" is-capital />`

export default function AmountDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <p className="amounts"><MdAmount value={1234.56} /></p>
        ) : active === 1 ? (
          <p className="amounts"><MdAmount value={1234567.89} hasSeparator /></p>
        ) : (
          <p className="amounts"><MdAmount value={1234.56} isCapital /></p>
        )
      }
    </DemoCanvasReact>
  )
}
