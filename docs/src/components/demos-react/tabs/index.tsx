import { useState } from 'react'
import { MdTabs, MdTabPane } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '多标签']
const code = `<MdTabs value={current} onChange={setCurrent}>
  <MdTabPane label="标签一" name="a">内容一</MdTabPane>
  <MdTabPane label="标签二" name="b">内容二</MdTabPane>
</MdTabs>`

export default function TabsDemo() {
  const [current, setCurrent] = useState('a')
  const [many, setMany] = useState('p1')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <MdTabs value={current} onChange={t => setCurrent(String(t.name))}>
              <MdTabPane label="标签一" name="a">
                <p className="tabs-demo-content">标签一的内容</p>
              </MdTabPane>
              <MdTabPane label="标签二" name="b">
                <p className="tabs-demo-content">标签二的内容</p>
              </MdTabPane>
            </MdTabs>
          )
        return (
          <MdTabs value={many} onChange={t => setMany(String(t.name))}>
            {Array.from({ length: 6 }, (_, i) => (
              <MdTabPane key={i} label={`标签${i + 1}`} name={`p${i + 1}`}>
                <p className="tabs-demo-content">第 {i + 1} 个标签的内容</p>
              </MdTabPane>
            ))}
          </MdTabs>
        )
      }}
    </DemoCanvasReact>
  )
}
