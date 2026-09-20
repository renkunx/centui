import { useState } from 'react'
import { CuTransition } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['淡入淡出', '滑动', '弹跳']
const code = `<CuTransition name="cu-fade">
  {show && <div>内容</div>}
</CuTransition>`
const names = ['cu-fade', 'cu-slide-up', 'cu-bounce']

export default function TransitionDemo() {
  const [show, setShow] = useState(true)
  const [idx, setIdx] = useState(0)

  const toggle = (i: number) => {
    setIdx(i)
    setShow(false)
    setTimeout(() => setShow(true), 300)
  }

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => (
        <div className="transition-demo">
          <button className="transition-demo-btn" onClick={() => toggle(active)}>
            播放{scenes[active]}
          </button>
          <CuTransition name={names[active]}>
            {show ? <div className="transition-demo-box">{scenes[active]}内容</div> : null}
          </CuTransition>
        </div>
      )}
    </DemoCanvasReact>
  )
}
