import { MdTip, MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['上方', '下方', '左侧', '右侧', '其他配置']
const code = `<MdTip content="不错哟" placement="top">
  <MdButton>点击我</MdButton>
</MdTip>
<MdTip icon="security" content="完善信息，领取5元免息券" fill>...</MdTip>`

export default function TipDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        const placements = ['top', 'bottom', 'left', 'right']
        if (active < 4)
          return (
            <MdTip content="不错哟" placement={placements[active]}>
              <MdButton type="default">点击我</MdButton>
            </MdTip>
          )
        return (
          <MdTip icon="security" content="完善信息，领取5元免息券" fill>
            <MdButton type="default">点击我</MdButton>
          </MdTip>
        )
      }}
    </DemoCanvasReact>
  )
}
