import { MdResultPage } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['空页面', '网络异常', '页面丢失', '自定义']
const code = `<MdResultPage type="empty" />
<MdResultPage type="network" />
<MdResultPage text="自定义" buttons={buttons} />`
const buttons = [{ text: '重新加载' }, { text: '返回', plain: false }]

export default function ResultPageDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => (
        <div className="result-page-demo-box">
          {active === 0 && <MdResultPage type="empty" />}
          {active === 1 && <MdResultPage type="network" />}
          {active === 2 && <MdResultPage type="lost" />}
          {active === 3 && <MdResultPage text="自定义标题" subtext="自定义描述" buttons={buttons} />}
        </div>
      )}
    </DemoCanvasReact>
  )
}
