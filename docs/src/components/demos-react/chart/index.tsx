import { CuChart } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['折线图', '区域图', '多折线', '渐变折线']
const code = `<CuChart labels={labels} datasets={datasets} size={[480, 270]} />
<CuChart datasets={[{ theme: 'region', ... }]} />
<CuChart datasets={[{ theme: 'heat', ... }]} />`
const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const lineData = [{ color: '#5b8ff9', width: 1, values: [120, 350, 420, 260, 180, 300, 450] }]
const regionData = [
  { color: '#fa8919', theme: 'region', width: 1, values: [100, 200, 150, 300] },
  { color: '#5b8ff9', values: [80, 150, 220, 180] },
]
const multiData = [
  { color: '#5b8ff9', width: 1, values: [120, 350, 420, 260, 180, 300, 450] },
  { color: '#fa8919', width: 1, values: [450, 300, 180, 260, 420, 350, 120] },
  { color: '#28aa91', width: 1, values: [80, 150, 200, 320, 380, 300, 260] },
]
const heatData = [
  { color: '#5e64ff', width: 1, theme: 'heat', values: [8, 15, 20, 23, 20, 30, 32, 38, 36, 40, 50, 55, 52] },
]
const heatLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function ChartDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="chart-demo-box">
              <CuChart labels={labels} datasets={lineData} size={[480, 270]} max={500} min={0} lines={5} step={100} />
            </div>
          )
        if (active === 1)
          return (
            <div className="chart-demo-box">
              <CuChart labels={['1月', '2月', '3月', '4月']} datasets={regionData} size={[480, 270]} max={300} min={0} lines={4} step={75} />
            </div>
          )
        if (active === 2)
          return (
            <div className="chart-demo-box">
              <CuChart labels={labels} datasets={multiData} size={[480, 270]} max={500} min={0} lines={5} step={100} />
            </div>
          )
        return (
          <div className="chart-demo-box">
            <CuChart
              labels={heatLabels}
              datasets={heatData}
              size={[480, 270]}
              max={60}
              min={0}
              lines={5}
              step={10}
              format={(v: number) => v + '%'}
            />
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
