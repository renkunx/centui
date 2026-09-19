import { useState } from 'react'
import { MdImageViewer, MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['图片查看']
const code = `<MdImageViewer value={show} onChange={setShow} list={imgs} initialIndex={0} />`
const imgs = [
  'https://img12.360buyimg.com/n1/jfs/t1/108640/22/11693/112095/5f077e78E834e5f16/12b5e15f4b0e7ed6.jpg',
  'https://img14.360buyimg.com/n1/jfs/t1/46036/33/4520/138517/5d38a75fEe33e2f2a/586d0d21bec5c83d.jpg',
]

export default function ImageViewerDemo() {
  const [show, setShow] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div className="viewer-demo">
          <MdButton type="primary" inline round onClick={() => setShow(true)}>
            查看图片
          </MdButton>
          <MdImageViewer value={show} list={imgs} initialIndex={0} />
        </div>
      )}
    </DemoCanvasReact>
  )
}
