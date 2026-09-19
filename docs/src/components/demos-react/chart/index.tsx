import { MdChart } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['折线图', '区域图']
const code = `<MdChart labels={labels} datasets={datasets} size={[480, 270]} />`
const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const lineData = [{ color: '#5b8ff9', width: 1, values: [120, 350, 420, 260, 180, 300, 450] }]
const regionData = [
  { color: '#fa8919', theme: 'region', width: 1, values: [100, 200, 150, 300] },
  { color: '#5b8ff9', values: [80, 150, 220, 180] },
]

export default function ChartDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="chart-demo-box">
              <MdChart labels={labels} datasets={lineData} size={[480, 270]} max={500} min={0} lines={5} step={100} />
            </div>
          )
        return (
          <div className="chart-demo-box">
            <MdChart labels={['1月', '2月', '3月', '4月']} datasets={regionData} size={[480, 270]} max={300} min={0} lines={4} step={75} />
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
