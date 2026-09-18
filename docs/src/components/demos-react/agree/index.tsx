import { useState } from 'react'
import { MdAgree } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['协议勾选']
const code = `<MdAgree v-model="value">我已阅读并同意协议</MdAgree>`

export default function AgreeDemo() {
  const [value, setValue] = useState(false)
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div style={{ padding: 16 }}>
          <MdAgree value={value} onChange={setValue}>本人承诺并同意本协议</MdAgree>
        </div>
      )}
    </DemoCanvasReact>
  )
}
