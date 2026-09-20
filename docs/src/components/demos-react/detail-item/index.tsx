import { CuDetailItem } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '加粗', '插槽']
const code = `<CuDetailItem title="标题" content="内容" />
<CuDetailItem title="标题" content="内容" bold />`

export default function DetailItemDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <CuDetailItem title="标题" content="内容内容内容" />
        if (active === 1) return <CuDetailItem title="标题" content="加粗内容" bold />
        return (
          <CuDetailItem title="标题">
            <span style={{ color: '#2f86f6' }}>插槽内容 ¥128.00</span>
          </CuDetailItem>
        )
      }}
    </DemoCanvasReact>
  )
}
