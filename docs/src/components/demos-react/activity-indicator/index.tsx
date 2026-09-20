import { CuActivityIndicator } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['roller', 'spinner', 'carousel']
const code = `<CuActivityIndicator type="roller" />
<CuActivityIndicator type="spinner" />
<CuActivityIndicator type="carousel" />`

export default function ActivityIndicatorDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => (
        <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', gap: 24 }}>
          <CuActivityIndicator
            type={active === 0 ? 'roller' : active === 1 ? 'spinner' : 'carousel'}
          />
          {active === 0 ? <span>加载中...</span> : null}
        </div>
      )}
    </DemoCanvasReact>
  )
}
