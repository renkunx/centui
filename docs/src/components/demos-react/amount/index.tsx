import { useEffect, useState } from 'react'
import { MdAmount } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['千位分隔符', '变化动效', '大写中文']
const code = `<MdAmount value={1234.125} precision={3} />
<MdAmount value={v} precision={2} transition />
<MdAmount value={1234.125} isCapital />`

export default function AmountDemo() {
  const [v, setV] = useState(1000)
  useEffect(() => {
    const t = setInterval(() => setV(Math.round(Math.random() * 10000)), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <MdAmount value={1234.125} precision={3} />
        if (active === 1) return <MdAmount value={v} precision={2} transition />
        return <MdAmount value={1234.125} isCapital />
      }}
    </DemoCanvasReact>
  )
}
