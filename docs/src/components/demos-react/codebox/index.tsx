import { useState } from 'react'
import { MdCodebox } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['系统键盘', '掩码遮蔽', '不限长度', '系统键盘不限长度']
const code = `<MdCodebox value={code} onChange={setCode} maxlength={4} />
<MdCodebox value={code} onChange={setCode} maxlength={6} mask />
<MdCodebox value={code} onChange={setCode} maxlength={-1} system />`

export default function CodeboxDemo() {
  const [code1, setCode1] = useState('')
  const [code2, setCode2] = useState('')
  const [code3, setCode3] = useState('')
  const [code4, setCode4] = useState('')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <MdCodebox value={code1} onChange={setCode1} maxlength={4} />
        if (active === 1) return <MdCodebox value={code2} onChange={setCode2} maxlength={6} mask />
        if (active === 2) return <MdCodebox value={code3} onChange={setCode3} maxlength={-1} />
        return <MdCodebox value={code4} onChange={setCode4} maxlength={-1} system />
      }}
    </DemoCanvasReact>
  )
}
