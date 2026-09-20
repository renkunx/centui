import { useState } from 'react'
import { CuTextareaItem } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '可清除', '错误提示', '禁用']
const code = `<CuTextareaItem value={v} onChange={setV} title="标题" placeholder="请输入" />
<CuTextareaItem value={v} onChange={setV} title="标题" clearable />
<CuTextareaItem value={v} onChange={setV} title="标题" error="错误提示" />`

export default function TextareaItemDemo() {
  const [basic, setBasic] = useState('')
  const [clearable, setClearable] = useState('可清除内容')
  const [error, setError] = useState('内容')
  const [disabled] = useState('禁用内容')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return <CuTextareaItem value={basic} onChange={setBasic} title="标题" placeholder="请输入简介" />
        if (active === 1)
          return <CuTextareaItem value={clearable} onChange={setClearable} title="标题" clearable />
        if (active === 2)
          return <CuTextareaItem value={error} onChange={setError} title="标题" error="内容不能为空" />
        return <CuTextareaItem value={disabled} title="标题" disabled />
      }}
    </DemoCanvasReact>
  )
}
