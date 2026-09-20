import { useState } from 'react'
import { CuSwitch } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['开启', '关闭', '开启不可用', '关闭不可用']
const code = `<CuSwitch value={v} onChange={setV} />`

export default function SwitchDemo() {
  const [on, setOn] = useState(true)
  const [off, setOff] = useState(false)
  const [onDisabled] = useState(true)
  const [offDisabled] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <CuSwitch value={on} onChange={setOn} />
        if (active === 1) return <CuSwitch value={off} onChange={setOff} />
        if (active === 2) return <CuSwitch value={onDisabled} disabled />
        return <CuSwitch value={offDisabled} disabled />
      }}
    </DemoCanvasReact>
  )
}
