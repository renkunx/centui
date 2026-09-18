import { useState } from 'react'
import { MdButton, MdDialog } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['确认对话框', '警告对话框']
const code = `Dialog.confirm({ title: '确认', onConfirm }) 
MdDialog 组件式用法见右图`

export default function DialogDemo() {
  const [show, setShow] = useState(false)
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active => (
        <div style={{ padding: 16, display: 'flex', gap: 12 }}>
          {active === 0 ? (
            <MdButton size="small" inline onClick={() => setShow(true)}>组件式对话框</MdButton>
          ) : (
            <MdButton
              size="small"
              inline
              onClick={() =>
                Dialog.confirm({ title: '警告', content: '确认删除该项？', onConfirm: () => setShow(false) })
              }
            >
              命令式 confirm
            </MdButton>
          )}
          <MdDialog
            value={show}
            title="对话框"
            content="这是一个 React 对话框"
            btns={[
              { text: '取消', handler: () => setShow(false) },
              { text: '确定', warning: true, handler: () => setShow(false) },
            ]}
            onChange={setShow}
          />
        </div>
      )}
    </DemoCanvasReact>
  )
}
