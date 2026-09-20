import { useState } from 'react'
import { MdAgree } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['未选中', '选中', '选中不可用', '未选中不可用', '方形选中', '方形未选中']
const code = `<MdAgree value={checked} onChange={setChecked}>本人承诺投保人已充分了解本保险产品</MdAgree>
<MdAgree value={checked} onChange={setChecked} iconType="square">...</MdAgree>`
const text = '本人承诺投保人已充分了解本保险产品，并保证投保信息的真实性，理解并同意'
const textLink = text + '<a>《投保须知》</a>, <a>《保险条款》</a>'

export default function AgreeDemo() {
  const [c0, setC0] = useState(false)
  const [c1, setC1] = useState(true)
  const [c2, setC2] = useState(true)
  const [c3, setC3] = useState(false)
  const [c4, setC4] = useState(true)
  const [c5, setC5] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        const body = (html: boolean) =>
          html ? <span dangerouslySetInnerHTML={{ __html: textLink }} /> : <>{text}</>
        if (active === 0)
          return <MdAgree value={c0} onChange={setC0}>{body(false)}</MdAgree>
        if (active === 1)
          return <MdAgree value={c1} onChange={setC1}>{body(true)}</MdAgree>
        if (active === 2)
          return <MdAgree value={c2} disabled onChange={setC2}>{body(false)}</MdAgree>
        if (active === 3)
          return <MdAgree value={c3} disabled onChange={setC3}>{body(false)}</MdAgree>
        if (active === 4)
          return <MdAgree value={c4} iconType="square" onChange={setC4}>{body(true)}</MdAgree>
        return <MdAgree value={c5} iconType="square" onChange={setC5}>{body(false)}</MdAgree>
      }}
    </DemoCanvasReact>
  )
}
