import { useState } from 'react'
import { CuSelector, CuButton } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['无需确认', '确认模式', 'Check 模式', '多选模式', '自定义选项']
const code = `<CuSelector value={show} onChange={setShow} data={data} onChoose={onChoose} />
<CuSelector value={show} onChange={setShow} data={data} okText="确定" onConfirm={onConfirm} />
<CuSelector value={show} onChange={setShow} data={data} isCheck />
<CuSelector value={show} onChange={setShow} data={data} multi okText="确定" />`
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
              <CuButton onClick={() => setShowA(true)}>无需确认</CuButton>
              <CuSelector value={showA} onChange={setShowA} data={data} title="无需确认" />
            </>
          )
        if (active === 1)
          return (
            <>
              <CuButton onClick={() => setShowB(true)}>确认模式</CuButton>
              <CuSelector value={showB} onChange={setShowB} data={data} title="确认模式" okText="确定" cancelText="取消" />
            </>
          )
        if (active === 2)
          return (
            <>
              <CuButton onClick={() => setShowC(true)}>Check 模式</CuButton>
              <CuSelector value={showC} onChange={setShowC} data={data} title="Check 模式" isCheck />
            </>
          )
        if (active === 3)
          return (
            <>
              <CuButton onClick={() => setShowD(true)}>多选模式</CuButton>
              <CuSelector value={showD} onChange={setShowD} data={data} multi title="多选模式" okText="确定" />
            </>
          )
        return (
          <>
            <CuButton onClick={() => setShowE(true)}>自定义选项</CuButton>
            <CuSelector
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
