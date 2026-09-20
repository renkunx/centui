import { useState } from 'react'
import { CuActionSheet, CuButton, Toast, type ActionSheetOption } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['选择面板']
const code = `<CuActionSheet v-model="show" :options="options" />`

const options: ActionSheetOption[] = [{ text: '选项一' }, { text: '选项二' }, { text: '禁用项' }]

export default function ActionSheetDemo() {
  const [show, setShow] = useState(false)
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {() => (
        <div style={{ padding: 16 }}>
          <CuButton size="small" inline onClick={() => setShow(true)}>打开动作面板</CuButton>
          <CuActionSheet
            value={show}
            title="操作"
            options={options}
            invalidIndex={2}
            onChange={setShow}
            onSelected={option => Toast.info(`选择了：${option.text}`)}
          />
        </div>
      )}
    </DemoCanvasReact>
  )
}
