import { useState } from 'react'
import { MdTabBar } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['两标签', '首屏五个', '滚动', '无下划线', '监听事件']
const code = `<MdTabBar value={current} onChange={setCurrent} items={items} />
<MdTabBar value={current} onChange={setCurrent} items={items} maxLength={5} />
<MdTabBar value={current} onChange={setCurrent} items={items} hasInk={false} />`
const two = [{ name: 1, label: '标签1' }, { name: 2, label: '标签2' }]
const five = Array.from({ length: 5 }, (_, i) => ({ name: i + 1, label: `标签${i + 1}` }))
const scroll = [
  { name: 1, label: '精选' },
  { name: 2, label: '全部' },
  { name: 3, label: '满减券' },
  { name: 4, label: '立减券' },
  { name: 5, label: '免息券' },
  { name: 6, label: '团购' },
]

export default function TabBarDemo() {
  const [current1, setCurrent1] = useState(1)
  const [current2, setCurrent2] = useState(1)
  const [current3, setCurrent3] = useState(1)
  const [current4, setCurrent4] = useState(1)
  const [current5, setCurrent5] = useState(1)
  const [msg, setMsg] = useState('')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <MdTabBar value={current1} onChange={t => setCurrent1(Number(t.name))} items={two} />
        if (active === 1) return <MdTabBar value={current2} onChange={t => setCurrent2(Number(t.name))} items={five} maxLength={5} />
        if (active === 2) return <MdTabBar value={current3} onChange={t => setCurrent3(Number(t.name))} items={scroll} maxLength={5} />
        if (active === 3) return <MdTabBar value={current4} onChange={t => setCurrent4(Number(t.name))} items={two} hasInk={false} />
        return (
          <div style={{ width: '100%' }}>
            <MdTabBar
              value={current5}
              onChange={t => {
                setCurrent5(Number(t.name))
                setMsg(`切换到 ${t.label}`)
              }}
              items={scroll}
              maxLength={5}
            />
            {msg ? <p style={{ fontSize: 24, color: '#2f86f6', padding: 16 }}>{msg}</p> : null}
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
