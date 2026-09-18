import { useState } from 'react'
import { MdSkeleton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['头像骨架', '段落骨架', '加载完成']
const code = `<MdSkeleton avatar title :row="2" loading />
<MdSkeleton :loading="false">内容</MdSkeleton>`

export default function SkeletonDemo() {
  const [loading, setLoading] = useState(true)
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div style={{ background: '#fff', padding: 16 }}>
              <MdSkeleton avatar title row={2} loading />
            </div>
          )
        if (active === 1)
          return (
            <div style={{ background: '#fff', padding: 16 }}>
              <MdSkeleton title row={3} loading />
            </div>
          )
        return (
          <div style={{ background: '#fff', padding: 16, minHeight: 80 }} onClick={() => setLoading(true)}>
            {loading ? <MdSkeleton avatar loading /> : <p>内容加载完成，点击重试</p>}
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
