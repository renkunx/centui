import { useState } from 'react'
import { CuStepper, CuField, CuFieldItem } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['禁用', '只读', '最小-12 最大18', '步进2 整数', '最小值4', 'step 1.3']
const code = `<CuStepper disabled />
<CuStepper readOnly />
<CuStepper value={v} onChange={setV} min={-12} max={18} />
<CuStepper value={v} onChange={setV} step={2} min={2} isInteger />`

export default function StepperDemo() {
  const [value, setValue] = useState(0)
  const [value2, setValue2] = useState(3)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return <CuField><CuFieldItem title="禁用"><CuStepper disabled /></CuFieldItem></CuField>
        if (active === 1)
          return <CuField><CuFieldItem title="只读"><CuStepper readOnly /></CuFieldItem></CuField>
        if (active === 2)
          return <CuField><CuFieldItem title="最小值-12，最大值18"><CuStepper value={value} onChange={setValue} min={-12} max={18} /></CuFieldItem></CuField>
        if (active === 3)
          return <CuField><CuFieldItem title="步进2, 只允许输入整数"><CuStepper value={value2} onChange={setValue2} step={2} min={2} isInteger /></CuFieldItem></CuField>
        if (active === 4)
          return <CuField><CuFieldItem title="最小值4大于默认值"><CuStepper min={4} /></CuFieldItem></CuField>
        return <CuField><CuFieldItem title="step为小数1.3"><CuStepper step={1.3} /></CuFieldItem></CuField>
      }}
    </DemoCanvasReact>
  )
}
