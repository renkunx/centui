import { useState } from 'react'
import { MdRadioGroup, MdRadio } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['单选组']
const code = `<MdRadioGroup v-model="value">
  <MdRadio name="0">按单</MdRadio>
</MdRadioGroup>`

export default function RadioDemo() {
  const [value, setValue] = useState<string | number | boolean>('0')
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div style={{ padding: 8 }}>
          <MdRadioGroup value={value} onChange={setValue}>
            <MdRadio name="0">按单结算</MdRadio>
            <MdRadio name="1" inline>按期结算</MdRadio>
          </MdRadioGroup>
          <p style={{ color: '#999', fontSize: 13 }}>当前：{String(value)}</p>
        </div>
      )}
    </DemoCanvasReact>
  )
}
