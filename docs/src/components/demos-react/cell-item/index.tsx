import { MdCellItem } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '箭头与附加', '多行']
const code = `<MdCellItem title="标题" brief="描述" addon="内容" arrow />
<MdCellItem title="无边框" no-border />`

export default function CellItemDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <div style={{ background: '#fff' }}>
            <MdCellItem title="标题" brief="描述文案" addon="内容" arrow />
          </div>
        ) : active === 1 ? (
          <div style={{ background: '#fff' }}>
            <MdCellItem title="自定义右侧" addon="附加">
              <span style={{ color: '#fc9153' }}>右侧插槽</span>
            </MdCellItem>
          </div>
        ) : (
          <div style={{ background: '#fff' }}>
            <MdCellItem title="多行标题" brief="这里是较长的描述文案，会换行展示" arrow />
          </div>
        )
      }
    </DemoCanvasReact>
  )
}
