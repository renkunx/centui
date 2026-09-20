import { CuTip, CuButton } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['上方', '下方', '左侧', '右侧', '其他配置']
const code = `<CuTip content="不错哟" placement="top">
  <CuButton>点击我</CuButton>
</CuTip>
<CuTip icon="security" content="完善信息，领取5元免息券" fill>...</CuTip>`

export default function TipDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        const placements = ['top', 'bottom', 'left', 'right']
        if (active < 4)
          return (
            <CuTip content="不错哟" placement={placements[active]}>
              <CuButton type="default">点击我</CuButton>
            </CuTip>
          )
        return (
          <CuTip icon="security" content="完善信息，领取5元免息券" fill>
            <CuButton type="default">点击我</CuButton>
          </CuTip>
        )
      }}
    </DemoCanvasReact>
  )
}
