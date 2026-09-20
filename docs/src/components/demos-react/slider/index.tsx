import { useState } from 'react'
import { CuSlider } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '范围选择', '格式化', '禁用']
const code = `<CuSlider value={value} onChange={setValue} />
<CuSlider value={range} range onChange={setRange} />
<CuSlider value={value} format={(v) => v + '%'} onChange={setValue} />`

export default function SliderDemo() {
  const [basic, setBasic] = useState(50)
  const [range, setRange] = useState<[number, number]>([20, 60])
  const [format, setFormat] = useState(70)
  const [disabled] = useState(40)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="slider-demo-block">
              <CuSlider value={basic} onChange={v => setBasic(v as number)} />
              <p className="slider-demo-value">当前值：{basic}</p>
            </div>
          )
        if (active === 1)
          return (
            <div className="slider-demo-block">
              <CuSlider value={range} range onChange={v => setRange(v as [number, number])} />
              <p className="slider-demo-value">区间：{range[0]} - {range[1]}</p>
            </div>
          )
        if (active === 2)
          return (
            <div className="slider-demo-block">
              <CuSlider value={format} format={v => `${v}%`} onChange={v => setFormat(v as number)} />
              <p className="slider-demo-value">拖动手柄查看提示</p>
            </div>
          )
        return (
          <div className="slider-demo-block">
            <CuSlider value={disabled} disabled />
            <p className="slider-demo-value">禁用状态</p>
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
