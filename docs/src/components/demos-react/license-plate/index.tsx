import { useState } from 'react'
import { MdLicensePlate } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['车牌输入']
const code = `<MdLicensePlate defaultValue={dv} onConfirm={onConfirm} />`

export default function LicensePlateDemo() {
  const [result, setResult] = useState('')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div className="license-plate-demo">
          <MdLicensePlate defaultValue="浙AD12345" onConfirm={v => setResult(v)} />
          {result ? <p className="license-plate-demo-result">{result}</p> : null}
        </div>
      )}
    </DemoCanvasReact>
  )
}
