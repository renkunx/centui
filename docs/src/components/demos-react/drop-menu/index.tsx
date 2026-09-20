import { useState } from 'react'
import { CuDropMenu } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础联动', '初始选中', '禁用项', '自定义菜单项']
const code = `<CuDropMenu data={data} defaultValue={defaultValue} onChange={onChange} />`
const data0 = [
  { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }, { value: '3', text: '服饰' }] },
  { text: '排序', options: [{ value: '4', text: '默认排序' }, { value: '5', text: '价格' }] },
]
const data1 = [
  { text: '类别', options: [{ value: '1', text: '全部' }, { value: '2', text: '数码' }] },
  { text: '排序', options: [{ value: '3', text: '默认排序' }, { value: '4', text: '价格' }] },
]
const data2 = [
  { text: '全部', options: [{ value: '1', text: '全部' }] },
  { text: '筛选', disabled: true, options: [{ value: '2', text: '价格' }] },
  { text: '排序', options: [{ value: '3', text: '默认' }, { value: '4', text: '评分', disabled: true }] },
]
const data3 = [
  { text: '自定义选项', options: [{ value: '1', text: '包含超长文本的选项内容演示' }, { value: '2', text: '短文本' }] },
]

export default function DropMenuDemo() {
  const [result, setResult] = useState('')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        const d = [data0, data1, data2, data3][active]
        const dv = active === 0 ? ['2'] : active === 1 ? ['2', '4'] : undefined
        return (
          <>
            <CuDropMenu
              data={d}
              defaultValue={dv}
              onChange={(barItem, listItem) => setResult(`${barItem.text}: ${listItem.text}`)}
            />
            {result ? <p style={{ fontSize: 24, color: '#2f86f6', padding: 12 }}>{result}</p> : null}
          </>
        )
      }}
    </DemoCanvasReact>
  )
}
