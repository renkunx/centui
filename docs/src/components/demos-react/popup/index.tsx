import { useState } from 'react'
import { CuPopup, CuPopupTitleBar, CuButton } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['底部弹层', '居中弹层']
const code = `<CuPopup v-model="show" position="bottom">
  <CuPopupTitleBar title="标题" only-close />
</CuPopup>`

export default function PopupDemo() {
  const [bottom, setBottom] = useState(false)
  const [center, setCenter] = useState(false)
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active => (
        <div style={{ padding: 16, display: 'flex', gap: 12 }}>
          {active === 0 ? (
            <CuButton size="small" inline onClick={() => setBottom(true)}>底部弹层</CuButton>
          ) : (
            <CuButton size="small" inline onClick={() => setCenter(true)}>居中弹层</CuButton>
          )}
          <CuPopup value={bottom} position="bottom" onChange={setBottom}>
            <div style={{ background: '#fff' }}>
              <CuPopupTitleBar title="底部弹层" only-close onCancel={() => setBottom(false)} />
              <p style={{ padding: 40, textAlign: 'center' }}>弹层内容</p>
            </div>
          </CuPopup>
          <CuPopup value={center} onChange={setCenter}>
            <div style={{ background: '#fff', padding: 32, borderRadius: 8 }} onClick={() => setCenter(false)}>
              居中弹层，点击关闭
            </div>
          </CuPopup>
        </div>
      )}
    </DemoCanvasReact>
  )
}
