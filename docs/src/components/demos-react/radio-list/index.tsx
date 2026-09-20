import { useState } from 'react'
import { CuRadioList } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['选项列表', '带自定义输入']
const code = `<CuRadioList v-model="value" :options="options" />`

const options = [
  { value: 'a', text: '选项一' },
  { value: 'b', text: '选项二' },
]

export default function RadioListDemo() {
  const [value, setValue] = useState<string | number | boolean>('a')
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <CuRadioList value={value} options={options} onChangeValue={setValue} />
        ) : (
          <CuRadioList
            value={value}
            options={options}
            hasInput
            inputLabel="其他"
            inputPlaceholder="请输入"
            onChangeValue={setValue}
          />
        )
      }
    </DemoCanvasReact>
  )
}
