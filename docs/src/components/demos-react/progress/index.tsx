import { useEffect, useState } from 'react'
import { MdProgress } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['自动递增']
const code = `<MdProgress :value="value" />`

export default function ProgressDemo() {
  const [value, setValue] = useState(0.2)
  useEffect(() => {
    const timer = setInterval(() => setValue(v => Math.round(((v + 0.1) % 1.1) * 100) / 100), 800)
    return () => clearInterval(timer)
  }, [])
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div style={{ minHeight: 100, display: 'flex', alignItems: 'center' }}>
          <MdProgress value={value} />
        </div>
      )}
    </DemoCanvasReact>
  )
}
