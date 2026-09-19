import { useState } from 'react'
import { MdSelector, MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['单选（即时）', '单选（确认）', '多选']
const code = `<MdSelector value={show} onChange={setShow} data={data} onChoose={onChoose} />
<MdSelector value={show} onChange={setShow} data={data} okText="确定" />
<MdSelector value={show} onChange={setShow} data={data} multi okText="确定" />`
const data = [
  { value: '1', text: '选项一' },
  { value: '2', text: '选项二' },
  { value: '3', text: '选项三' },
]
const multiData = [
  { value: 'a', text: '选项 A' },
  { value: 'b', text: '选项 B' },
]

export default function SelectorDemo() {
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [show3, setShow3] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="selector-demo">
              <MdButton type="primary" inline round onClick={() => setShow1(true)}>
                单选（即时）
              </MdButton>
              <MdSelector value={show1} onChange={setShow1} data={data} title="选择选项" />
            </div>
          )
        if (active === 1)
          return (
            <div className="selector-demo">
              <MdButton type="primary" inline round onClick={() => setShow2(true)}>
                单选（确认）
              </MdButton>
              <MdSelector value={show2} onChange={setShow2} data={data} title="选择选项" okText="确定" cancelText="取消" />
            </div>
          )
        return (
          <div className="selector-demo">
            <MdButton type="primary" inline round onClick={() => setShow3(true)}>
              多选
            </MdButton>
            <MdSelector value={show3} onChange={setShow3} data={multiData} multi title="多选" okText="确定" />
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
