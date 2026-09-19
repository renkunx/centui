import { useState } from 'react'
import { MdLandscape, MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['弹层横屏', '全屏横屏']
const code = `<MdLandscape value={show} onChange={setShow}>
  <img src="..." />
</MdLandscape>
<MdLandscape value={show} fullScreen />`

export default function LandscapeDemo() {
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="landscape-demo">
              <MdButton type="primary" inline round onClick={() => setShow1(true)}>
                打开横屏弹层
              </MdButton>
              <MdLandscape value={show1} onChange={setShow1}>
                <img
                  className="landscape-demo-img"
                  src="https://img12.360buyimg.com/n1/jfs/t1/108640/22/11693/112095/5f077e78E834e5f16/12b5e15f4b0e7ed6.jpg"
                />
              </MdLandscape>
            </div>
          )
        return (
          <div className="landscape-demo">
            <MdButton type="primary" inline round onClick={() => setShow2(true)}>
              打开全屏横屏
            </MdButton>
            <MdLandscape value={show2} onChange={setShow2} fullScreen>
              <p className="landscape-demo-text">全屏横屏内容</p>
            </MdLandscape>
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
