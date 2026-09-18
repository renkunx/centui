import { MdFieldItem } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '箭头']
const code = `<MdFieldItem title="标题" addon="内容" arrow />`

export default function FieldItemDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <div style={{ background: '#fff', minWidth: 320 }}>
            <MdFieldItem title="标题" placeholder="占位内容" solid />
          </div>
        ) : (
          <div style={{ background: '#fff', minWidth: 320 }}>
            <MdFieldItem title="跳转详情" addon="查看" arrow />
          </div>
        )
      }
    </DemoCanvasReact>
  )
}
