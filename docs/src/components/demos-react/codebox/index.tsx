import { useState } from 'react'
import { MdCodebox } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['输入验证码', '掩码']
const code = `<MdCodebox v-model="code" maxlength={4} />`

export default function CodeboxDemo() {
  const [code, setCode] = useState('')
  const [masked, setMasked] = useState('1234')
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <div style={{ padding: 24 }}>
            <MdCodebox maxlength={4} value={code} onChange={setCode} isView />
            <p style={{ color: '#999', fontSize: 13 }}>当前输入：{code}</p>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            <MdCodebox maxlength={4} value={masked} onChange={setMasked} mask isView />
          </div>
        )
      }
    </DemoCanvasReact>
  )
}
