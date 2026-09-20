import { useState } from 'react'
import { CuNumberKeyboard, CuButton, CuIcon } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['有小数点', '无小数点', '简单类型', '乱序+确认', '插槽', '禁用']
const code = `<CuNumberKeyboard value={show} onChange={setShow} onEnter={onEnter} onDelete={onDelete} />
<CuNumberKeyboard value={show} onChange={setShow} hideDot />
<CuNumberKeyboard value={show} onChange={setShow} type="simple" />
<CuNumberKeyboard value={show} onChange={setShow} okText="支付" disorder />`

export default function NumberKeyboardDemo() {
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [show3, setShow3] = useState(false)
  const [show4, setShow4] = useState(false)
  const [show5, setShow5] = useState(false)
  const [show6, setShow6] = useState(false)
  const [number, setNumber] = useState('')

  const onEnter = (v: string | number) => setNumber(prev => prev + String(v))
  const onDelete = () => setNumber(prev => prev.slice(0, -1))

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div style={{ width: '100%' }}>
              <CuButton onClick={() => setShow1(!show1)}>{show1 ? '收起键盘' : '唤起键盘，有小数点'}</CuButton>
              <CuNumberKeyboard value={show1} onChange={setShow1} onEnter={onEnter} onDelete={onDelete} />
              {number ? <p style={{ fontSize: 26, padding: 12 }}>{number}</p> : null}
            </div>
          )
        if (active === 1)
          return (
            <div style={{ width: '100%' }}>
              <CuButton onClick={() => setShow2(!show2)}>{show2 ? '收起键盘' : '唤起键盘，无小数点'}</CuButton>
              <CuNumberKeyboard value={show2} onChange={setShow2} hideDot onEnter={onEnter} onDelete={onDelete} />
            </div>
          )
        if (active === 2)
          return (
            <div style={{ width: '100%' }}>
              <CuButton onClick={() => setShow3(!show3)}>{show3 ? '收起键盘' : '简单类型'}</CuButton>
              <CuNumberKeyboard value={show3} onChange={setShow3} type="simple" onEnter={onEnter} onDelete={onDelete} />
              {show3 && number ? <p style={{ fontSize: 26, padding: 12 }}>{number}</p> : null}
            </div>
          )
        if (active === 3)
          return (
            <div style={{ width: '100%' }}>
              <CuButton onClick={() => setShow4(!show4)}>{show4 ? '收起键盘' : '乱序 + 确认支付'}</CuButton>
              <CuNumberKeyboard value={show4} onChange={setShow4} okText="支付" disorder onEnter={onEnter} onDelete={onDelete} />
            </div>
          )
        if (active === 4)
          return (
            <div style={{ width: '100%' }}>
              <CuButton onClick={() => setShow5(!show5)}>{show5 ? '收起键盘' : '插槽：安全支付'}</CuButton>
              <CuNumberKeyboard value={show5} onChange={setShow5} okText="支付" disorder>
                <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, fontSize: 22 }}>
                  <CuIcon name="security" />&nbsp;安全支付
                </p>
              </CuNumberKeyboard>
            </div>
          )
        return (
          <div style={{ width: '100%' }}>
            <CuButton onClick={() => setShow6(!show6)}>{show6 ? '收起键盘' : '禁用键盘'}</CuButton>
            <CuNumberKeyboard value={show6} onChange={setShow6} disabled onEnter={onEnter} onDelete={onDelete} />
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
