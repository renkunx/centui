import { useState } from 'react'
import { MdPopup, MdPopupTitleBar, MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['底部弹层', '居中弹层']
const code = `<MdPopup v-model="show" position="bottom">
  <MdPopupTitleBar title="标题" only-close />
</MdPopup>`

export default function PopupDemo() {
  const [bottom, setBottom] = useState(false)
  const [center, setCenter] = useState(false)
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active => (
        <div style={{ padding: 16, display: 'flex', gap: 12 }}>
          {active === 0 ? (
            <MdButton size="small" inline onClick={() => setBottom(true)}>底部弹层</MdButton>
          ) : (
            <MdButton size="small" inline onClick={() => setCenter(true)}>居中弹层</MdButton>
          )}
          <MdPopup value={bottom} position="bottom" onChange={setBottom}>
            <div style={{ background: '#fff' }}>
              <MdPopupTitleBar title="底部弹层" only-close onCancel={() => setBottom(false)} />
              <p style={{ padding: 40, textAlign: 'center' }}>弹层内容</p>
            </div>
          </MdPopup>
          <MdPopup value={center} onChange={setCenter}>
            <div style={{ background: '#fff', padding: 32, borderRadius: 8 }} onClick={() => setCenter(false)}>
              居中弹层，点击关闭
            </div>
          </MdPopup>
        </div>
      )}
    </DemoCanvasReact>
  )
}
