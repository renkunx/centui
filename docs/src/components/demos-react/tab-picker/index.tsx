import { useState } from 'react'
import { CuTabPicker, CuButton } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['省市级联']
const code = `<CuTabPicker value={show} onInput={setShow} data={data} onChange={onChange} />`
const data = {
  name: 'level1',
  label: '省份',
  options: [
    {
      value: 'zj',
      label: '浙江',
      children: {
        name: 'level2',
        label: '城市',
        options: [{ value: 'hz', label: '杭州' }, { value: 'nb', label: '宁波' }],
      },
    },
    { value: 'js', label: '江苏' },
  ],
}

export default function TabPickerDemo() {
  const [show, setShow] = useState(false)
  const [result, setResult] = useState('')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div className="tab-picker-demo">
          <CuButton type="primary" inline round onClick={() => setShow(true)}>
            打开联动选择
          </CuButton>
          {result ? <p className="tab-picker-demo-result">{result}</p> : null}
          <CuTabPicker
            value={show}
            onInput={setShow}
            data={data}
            title="请选择地区"
            onChange={payload => {
              setResult(payload.values.join(' / '))
            }}
          />
        </div>
      )}
    </DemoCanvasReact>
  )
}
