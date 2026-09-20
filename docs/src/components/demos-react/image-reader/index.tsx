import { useState } from 'react'
import { CuImageReader } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['文件选择']
const code = `<CuImageReader onSelect={onSelect} onError={onError} />`

export default function ImageReaderDemo() {
  const [msg, setMsg] = useState('')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div className="image-reader-demo">
          <div className="image-reader-demo-box">
            <CuImageReader
              onSelect={(n, d) => setMsg(`已选择 ${d.files.length} 个文件`)}
              onError={(n, d) => setMsg(`错误 ${d.code}: ${d.msg}`)}
            />
            <span className="image-reader-demo-tip">点击选择图片</span>
          </div>
          {msg ? <p className="image-reader-demo-msg">{msg}</p> : null}
        </div>
      )}
    </DemoCanvasReact>
  )
}
