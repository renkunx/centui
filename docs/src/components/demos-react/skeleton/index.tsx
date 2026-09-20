import { useState } from 'react'
import { CuSkeleton, CuCellItem } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['加载正文', '组合骨架', '组合完整内容']
const code = `<CuSkeleton title loading={loading} />
<CuSkeleton avatar title />
<CuSkeleton avatar title loading={loading} row={2}>
  <CuCellItem title="交通银行" brief="展示摘要描述" />
</CuSkeleton>`

export default function SkeletonDemo() {
  const [loading] = useState(true)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <CuSkeleton title loading={loading} />
        if (active === 1) return <CuSkeleton avatar title loading={loading} />
        return (
          <CuField>
            <CuSkeleton avatar title loading={loading} row={2}>
              <CuCellItem title="交通银行" brief="展示摘要描述" addon="附加文案" arrow />
            </CuSkeleton>
            <CuSkeleton avatar title loading={loading} row={2}>
              <CuCellItem title="招商银行" brief="展示摘要描述" addon="附加文案" arrow />
            </CuSkeleton>
          </CuField>
        )
      }}
    </DemoCanvasReact>
  )
}
