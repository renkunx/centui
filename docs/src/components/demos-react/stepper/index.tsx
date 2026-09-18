import { useState } from 'react'
import { MdStepper } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '步长与范围', '禁用']
const code = `<MdStepper value={v} />
<MdStepper value={v} min={0} max={10} step={2} />
<MdStepper value={v} disabled />`

export default function StepperDemo() {
  const [v1, setV1] = useState(2)
  const [v2, setV2] = useState(2)
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <div style={{ padding: 8 }}>
            <MdStepper value={v1} onChange={setV1} />
            <p style={{ color: '#999', fontSize: 13 }}>当前值：{v1}</p>
          </div>
        ) : active === 1 ? (
          <div style={{ padding: 8 }}>
            <MdStepper value={v2} min={0} max={10} step={2} onChange={setV2} />
            <p style={{ color: '#999', fontSize: 13 }}>步长 2，范围 0 ~ 10</p>
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            <MdStepper value={3} disabled />
          </div>
        )
      }
    </DemoCanvasReact>
  )
}
