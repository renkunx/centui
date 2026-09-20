import { useState } from 'react'
import { MdSwitch } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['开启', '关闭', '开启不可用', '关闭不可用']
const code = `<MdSwitch value={v} onChange={setV} />`

export default function SwitchDemo() {
  const [on, setOn] = useState(true)
  const [off, setOff] = useState(false)
  const [onDisabled] = useState(true)
  const [offDisabled] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <MdSwitch value={on} onChange={setOn} />
        if (active === 1) return <MdSwitch value={off} onChange={setOff} />
        if (active === 2) return <MdSwitch value={onDisabled} disabled />
        return <MdSwitch value={offDisabled} disabled />
      }}
    </DemoCanvasReact>
  )
}
