import { useEffect, useState } from 'react'
import { CuAmount } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['千位分隔符', '变化动效', '大写中文']
const code = `<CuAmount value={1234.125} precision={3} />
<CuAmount value={v} precision={2} transition />
<CuAmount value={1234.125} isCapital />`

export default function AmountDemo() {
  const [v, setV] = useState(1000)
  useEffect(() => {
    const t = setInterval(() => setV(Math.round(Math.random() * 10000)), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <CuAmount value={1234.125} precision={3} />
        if (active === 1) return <CuAmount value={v} precision={2} transition />
        return <CuAmount value={1234.125} isCapital />
      }}
    </DemoCanvasReact>
  )
}
