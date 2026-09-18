import { MdButton, MdTip } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['四向气泡']
const code = `<MdTip content="提示内容" placement="top">
  <MdButton>触发</MdButton>
</MdTip>`

export default function TipDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div style={{ display: 'flex', gap: 16, padding: 24 }}>
          <MdTip content="上方提示" placement="top">
            <MdButton size="small" inline>top</MdButton>
          </MdTip>
          <MdTip content="下方提示" placement="bottom">
            <MdButton size="small" inline>bottom</MdButton>
          </MdTip>
          <MdTip content="左侧提示" placement="left">
            <MdButton size="small" inline>left</MdButton>
          </MdTip>
        </div>
      )}
    </DemoCanvasReact>
  )
}
