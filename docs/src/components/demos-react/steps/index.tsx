import { useState } from 'react'
import { MdSteps } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['横向', '带描述', '纵向']
const code = `<MdSteps steps={steps} current={1} />
<MdSteps steps={stepsWithDesc} current={2} />
<MdSteps steps={steps} current={1} direction="vertical" />`
const steps = [{ name: '第一步' }, { name: '第二步' }, { name: '第三步' }]
const stepsWithDesc = [
  { name: '下单', text: '2016-12-12' },
  { name: '付款', text: '2016-12-13' },
  { name: '发货', text: '2016-12-14' },
]

export default function StepsDemo() {
  const [current] = useState(1)
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <div className="steps-demo-box"><MdSteps steps={steps} current={current} /></div>
        if (active === 1) return <div className="steps-demo-box"><MdSteps steps={stepsWithDesc} current={2} /></div>
        return <div className="steps-demo-box"><MdSteps steps={steps} current={1} direction="vertical" /></div>
      }}
    </DemoCanvasReact>
  )
}
