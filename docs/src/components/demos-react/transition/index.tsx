import { useState } from 'react'
import { MdTransition } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['淡入淡出', '滑动', '弹跳']
const code = `<MdTransition name="md-fade">
  {show && <div>内容</div>}
</MdTransition>`
const names = ['md-fade', 'md-slide-up', 'md-bounce']

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
          <MdTransition name={names[active]}>
            {show ? <div className="transition-demo-box">{scenes[active]}内容</div> : null}
          </MdTransition>
        </div>
      )}
    </DemoCanvasReact>
  )
}
