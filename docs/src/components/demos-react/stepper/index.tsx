import { useState } from 'react'
import { MdStepper, MdField, MdFieldItem } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['禁用', '只读', '最小-12 最大18', '步进2 整数', '最小值4', 'step 1.3']
const code = `<MdStepper disabled />
<MdStepper readOnly />
<MdStepper value={v} onChange={setV} min={-12} max={18} />
<MdStepper value={v} onChange={setV} step={2} min={2} isInteger />`

export default function StepperDemo() {
  const [value, setValue] = useState(0)
  const [value2, setValue2] = useState(3)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return <MdField><MdFieldItem title="禁用"><MdStepper disabled /></MdFieldItem></MdField>
        if (active === 1)
          return <MdField><MdFieldItem title="只读"><MdStepper readOnly /></MdFieldItem></MdField>
        if (active === 2)
          return <MdField><MdFieldItem title="最小值-12，最大值18"><MdStepper value={value} onChange={setValue} min={-12} max={18} /></MdFieldItem></MdField>
        if (active === 3)
          return <MdField><MdFieldItem title="步进2, 只允许输入整数"><MdStepper value={value2} onChange={setValue2} step={2} min={2} isInteger /></MdFieldItem></MdField>
        if (active === 4)
          return <MdField><MdFieldItem title="最小值4大于默认值"><MdStepper min={4} /></MdFieldItem></MdField>
        return <MdField><MdFieldItem title="step为小数1.3"><MdStepper step={1.3} /></MdFieldItem></MdField>
      }}
    </DemoCanvasReact>
  )
}
