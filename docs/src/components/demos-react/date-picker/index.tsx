import { useState } from 'react'
import { MdDatePicker, MdButton, Toast } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['日期选择', '常驻视图']
const code = `<MdDatePicker v-model="show" type="date" @confirm="onConfirm" />`

export default function DatePickerDemo() {
  const [show, setShow] = useState(false)
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <div style={{ padding: 16 }}>
            <MdButton size="small" inline onClick={() => setShow(true)}>选择日期</MdButton>
            <MdDatePicker
              value={show}
              type="date"
              default-date={new Date(2024, 5, 15)}
              min-date={new Date(2020, 0, 1)}
              max-date={new Date(2030, 11, 31)}
              onChangeValue={setShow}
              onConfirm={values => {
                setShow(false)
                Toast.info(`选择 ${values[2]?.text}`)
              }}
            />
          </div>
        ) : (
          <MdDatePicker
            isView
            type="date"
            default-date={new Date(2024, 5, 15)}
            min-date={new Date(2024, 5, 1)}
            max-date={new Date(2024, 5, 30)}
          />
        )
      }
    </DemoCanvasReact>
  )
}
