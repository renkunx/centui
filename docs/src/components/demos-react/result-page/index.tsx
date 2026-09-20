import { CuResultPage } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['空页面', '网络异常', '页面丢失', '自定义']
const code = `<CuResultPage type="empty" />
<CuResultPage type="network" />
<CuResultPage text="自定义" buttons={buttons} />`
const buttons = [{ text: '重新加载' }, { text: '返回', plain: false }]

export default function ResultPageDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => (
        <div className="result-page-demo-box">
          {active === 0 && <CuResultPage type="empty" />}
          {active === 1 && <CuResultPage type="network" />}
          {active === 2 && <CuResultPage type="lost" />}
          {active === 3 && <CuResultPage text="自定义标题" subtext="自定义描述" buttons={buttons} />}
        </div>
      )}
    </DemoCanvasReact>
  )
}
