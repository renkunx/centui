import { useState } from 'react'
import { MdCheckGroup, MdCheck } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['复选组']
const code = `<MdCheckGroup v-model="values">
  <MdCheck name="day">日结算</MdCheck>
</MdCheckGroup>`

export default function CheckDemo() {
  const [values, setValues] = useState<Array<string | number | boolean>>(['day'])
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div style={{ padding: 8 }}>
          <MdCheckGroup value={values} onChange={setValues}>
            <MdCheck name="day">日结算</MdCheck>
            <MdCheck name="week">周结算</MdCheck>
            <MdCheck name="month" disabled>月结算（禁用）</MdCheck>
          </MdCheckGroup>
          <p style={{ color: '#999', fontSize: 13 }}>当前：{JSON.stringify(values)}</p>
        </div>
      )}
    </DemoCanvasReact>
  )
}
