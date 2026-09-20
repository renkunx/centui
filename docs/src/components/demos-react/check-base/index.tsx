import { useState } from 'react'
import { CuCheckBox, CuRadioBox } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['复选盒', '单选盒']
const code = `<CuCheckBox v-model="checked" name="a" label="选项" />`

export default function CheckBaseDemo() {
  const [checked, setChecked] = useState<string | number | boolean>('a')
  const [radio, setRadio] = useState<string | number | boolean>('a')
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <CuCheckBox name="a" value={checked} label="选项一" onChange={setChecked} />
            <CuCheckBox name="b" value={checked} label="选项二" onChange={setChecked} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <CuRadioBox name="a" value={radio} label="选项一" onChange={setRadio} />
            <CuRadioBox name="b" value={radio} label="选项二" onChange={setRadio} />
          </div>
        )
      }
    </DemoCanvasReact>
  )
}
