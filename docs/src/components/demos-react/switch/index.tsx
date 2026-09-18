import { useState } from 'react'
import { MdSwitch } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['开关', '禁用']
const code = `<MdSwitch v-model="on" />`

export default function SwitchDemo() {
  const [on, setOn] = useState(true)
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <MdSwitch value={on} onChange={setOn} />
        ) : (
          <MdSwitch value disabled />
        )
      }
    </DemoCanvasReact>
  )
}
