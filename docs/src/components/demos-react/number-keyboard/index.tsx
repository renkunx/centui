import { useState } from 'react'
import { MdNumberKeyboard } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['专业键盘', '简单键盘']
const code = `<MdNumberKeyboard is-view value type="professional" />`

export default function NumberKeyboardDemo() {
  const [show, setShow] = useState(true)
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <MdNumberKeyboard isView value type="professional" />
        ) : (
          <>
            <div style={{ padding: 16, textAlign: 'center' }}>
              <button onClick={() => setShow(true)}>弹出简单键盘</button>
            </div>
            <MdNumberKeyboard value={show} type="simple" onChange={setShow} />
          </>
        )
      }
    </DemoCanvasReact>
  )
}
