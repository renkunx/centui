import { useState } from 'react'
import { CuAgree } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['未选中', '选中', '选中不可用', '未选中不可用', '方形选中', '方形未选中']
const code = `<CuAgree value={checked} onChange={setChecked}>本人承诺投保人已充分了解本保险产品</CuAgree>
<CuAgree value={checked} onChange={setChecked} iconType="square">...</CuAgree>`
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
          return <CuAgree value={c0} onChange={setC0}>{body(false)}</CuAgree>
        if (active === 1)
          return <CuAgree value={c1} onChange={setC1}>{body(true)}</CuAgree>
        if (active === 2)
          return <CuAgree value={c2} disabled onChange={setC2}>{body(false)}</CuAgree>
        if (active === 3)
          return <CuAgree value={c3} disabled onChange={setC3}>{body(false)}</CuAgree>
        if (active === 4)
          return <CuAgree value={c4} iconType="square" onChange={setC4}>{body(true)}</CuAgree>
        return <CuAgree value={c5} iconType="square" onChange={setC5}>{body(false)}</CuAgree>
      }}
    </DemoCanvasReact>
  )
}
