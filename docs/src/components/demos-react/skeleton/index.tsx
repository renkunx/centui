import { useState } from 'react'
import { MdSkeleton, MdCellItem } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['加载正文', '组合骨架', '组合完整内容']
const code = `<MdSkeleton title loading={loading} />
<MdSkeleton avatar title />
<MdSkeleton avatar title loading={loading} row={2}>
  <MdCellItem title="交通银行" brief="展示摘要描述" />
</MdSkeleton>`

export default function SkeletonDemo() {
  const [loading] = useState(true)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <MdSkeleton title loading={loading} />
        if (active === 1) return <MdSkeleton avatar title loading={loading} />
        return (
          <MdField>
            <MdSkeleton avatar title loading={loading} row={2}>
              <MdCellItem title="交通银行" brief="展示摘要描述" addon="附加文案" arrow />
            </MdSkeleton>
            <MdSkeleton avatar title loading={loading} row={2}>
              <MdCellItem title="招商银行" brief="展示摘要描述" addon="附加文案" arrow />
            </MdSkeleton>
          </MdField>
        )
      }}
    </DemoCanvasReact>
  )
}
