import { useState } from 'react'
import { MdDropMenu } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础联动']
const code = `<MdDropMenu data={data} defaultValue={['2']} onChange={onChange} />`
const data = [
  { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }, { value: '3', text: '服饰' }] },
  { text: '排序', options: [{ value: '4', text: '默认排序' }, { value: '5', text: '价格' }] },
]

export default function DropMenuDemo() {
  const [result, setResult] = useState('')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div className="drop-menu-demo">
          <MdDropMenu
            data={data}
            defaultValue={['2']}
            onChange={(barItem, listItem) => setResult(`${barItem.text}: ${listItem.text}`)}
          />
          {result ? <p className="drop-menu-demo-result">{result}</p> : null}
          <p className="drop-menu-demo-tip">点击顶部栏展开选项</p>
        </div>
      )}
    </DemoCanvasReact>
  )
}
