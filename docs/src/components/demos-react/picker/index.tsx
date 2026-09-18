import { useState } from 'react'
import { MdPicker, MdButton, Toast } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['多列选择']
const code = `<MdPicker v-model="show" :data="data" @confirm="onConfirm" />`

const data = [
  [{ text: '周一' }, { text: '周二' }, { text: '周三' }],
  [{ text: '上午' }, { text: '下午' }],
]

export default function PickerDemo() {
  const [show, setShow] = useState(false)
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {() => (
        <div style={{ padding: 16 }}>
          <MdButton size="small" inline onClick={() => setShow(true)}>打开选择器</MdButton>
          <MdPicker
            value={show}
            cols={2}
            data={data}
            onChangeValue={setShow}
            onConfirm={values => {
              setShow(false)
              Toast.info(`选择了 ${values[0]?.text} ${values[1]?.text}`)
            }}
          />
        </div>
      )}
    </DemoCanvasReact>
  )
}
