import { useState } from 'react'
import { MdInputItem } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['文本', '手机号', '金额']
const code = `<MdInputItem title="姓名" placeholder="请输入" />
<MdInputItem title="手机号" type="phone" />
<MdInputItem title="金额" type="money" />`

export default function InputItemDemo() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [money, setMoney] = useState('')
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <MdInputItem title="姓名" placeholder="请输入姓名" value={name} onChange={setName} />
        ) : active === 1 ? (
          <MdInputItem title="手机号" type="phone" placeholder="请输入" value={phone} onChange={setPhone} />
        ) : (
          <MdInputItem title="金额" type="money" placeholder="请输入金额" value={money} onChange={setMoney} />
        )
      }
    </DemoCanvasReact>
  )
}
