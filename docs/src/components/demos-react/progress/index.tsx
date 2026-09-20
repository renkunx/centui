import { MdProgress, MdAmount } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '其他配置']
const code = `<MdProgress size={100} value={0.2} width={5}>20%</MdProgress>
<MdProgress value={0.8} color="url(#linear)" rotate={-90} transition />`

export default function ProgressDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div style={{ display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
              <MdProgress size={100} value={0.2} width={5}>20%</MdProgress>
              <MdProgress size={100} value={0.5} width={5}>50%</MdProgress>
              <MdProgress size={100} value={0.8} width={5}>80%</MdProgress>
            </div>
          )
        return (
          <div style={{ display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', padding: '20px 0' }}>
            <MdProgress
              value={0.8}
              width={10}
              size={100}
              color="url(#linear)"
              borderColor="#FFF"
              linecap="butt"
              defsSlot={
                <linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF5257" />
                  <stop offset="100%" stopColor="#FFC541D6" />
                </linearGradient>
              }
            >
              <span style={{ fontSize: 24 }}>80%</span>
            </MdProgress>
            <MdProgress value={0.8} width={10} size={100} rotate={-90} color="#FF5257" transition>
              <MdAmount value={80} precision={0} />
            </MdProgress>
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
