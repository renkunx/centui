import { useState } from 'react'
import { MdSelector, MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['无需确认', '确认模式', 'Check 模式', '多选模式', '自定义选项']
const code = `<MdSelector value={show} onChange={setShow} data={data} onChoose={onChoose} />
<MdSelector value={show} onChange={setShow} data={data} okText="确定" onConfirm={onConfirm} />
<MdSelector value={show} onChange={setShow} data={data} isCheck />
<MdSelector value={show} onChange={setShow} data={data} multi okText="确定" />`
const data = [
  { value: '1', text: '选项一', brief: '选项一描述' },
  { value: '2', text: '选项二', brief: '选项二描述' },
  { value: '3', text: '选项三', brief: '选项三描述' },
]

export default function SelectorDemo() {
  const [showA, setShowA] = useState(false)
  const [showB, setShowB] = useState(false)
  const [showC, setShowC] = useState(false)
  const [showD, setShowD] = useState(false)
  const [showE, setShowE] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <>
              <MdButton onClick={() => setShowA(true)}>无需确认</MdButton>
              <MdSelector value={showA} onChange={setShowA} data={data} title="无需确认" />
            </>
          )
        if (active === 1)
          return (
            <>
              <MdButton onClick={() => setShowB(true)}>确认模式</MdButton>
              <MdSelector value={showB} onChange={setShowB} data={data} title="确认模式" okText="确定" cancelText="取消" />
            </>
          )
        if (active === 2)
          return (
            <>
              <MdButton onClick={() => setShowC(true)}>Check 模式</MdButton>
              <MdSelector value={showC} onChange={setShowC} data={data} title="Check 模式" isCheck />
            </>
          )
        if (active === 3)
          return (
            <>
              <MdButton onClick={() => setShowD(true)}>多选模式</MdButton>
              <MdSelector value={showD} onChange={setShowD} data={data} multi title="多选模式" okText="确定" />
            </>
          )
        return (
          <>
            <MdButton onClick={() => setShowE(true)}>自定义选项</MdButton>
            <MdSelector
              value={showE}
              onChange={setShowE}
              data={data}
              title="自定义选项"
              children={({ option, selected }: { option: { text?: string }; selected: boolean }) => (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
                  <span>{option.text}</span>
                  {selected ? <span style={{ color: '#2f86f6' }}>已选</span> : null}
                </div>
              )}
            />
          </>
        )
      }}
    </DemoCanvasReact>
  )
}
