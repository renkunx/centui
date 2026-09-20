import { useState } from 'react'
import { CuRuler } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础刻度', '自定义文案']
const code = `<CuRuler value={v} onChange={setV} scope={[0, 1000]} step={100} unit={25} />
<CuRuler value={v} onChange={setV} stepTextRender={(v) => v + 'cm'} />`

export default function RulerDemo() {
  const [value, setValue] = useState(500)
  const [value2, setValue2] = useState(100)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="ruler-demo-box">
              <CuRuler value={value} onChange={setValue} scope={[0, 1000]} step={100} unit={25} />
              <p className="ruler-demo-value">当前值：{value}</p>
            </div>
          )
        return (
          <div className="ruler-demo-box">
            <CuRuler
              value={value2}
              onChange={setValue2}
              scope={[0, 200]}
              step={50}
              unit={10}
              stepTextRender={v => `${v}cm`}
            />
            <p className="ruler-demo-value">当前值：{value2}cm</p>
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
