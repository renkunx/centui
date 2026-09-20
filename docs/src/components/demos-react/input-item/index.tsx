import { useState } from 'react'
import { MdInputItem, MdField, MdFieldItem, MdIcon } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['普通输入框', '业务场景', '大尺寸金融表单', '标题浮动', '错误提示', '表单控件']
const code = `<MdInputItem title="普通文本" placeholder="普通文本" />
<MdInputItem type="bankCard" title="银行卡" placeholder="xxx xxxx xxxx xxxx" />
<MdInputItem title="真实姓名" isTitleLatent placeholder="投保人姓名" />`

export default function InputItemDemo() {
  const [bankCardNo, setBankCardNo] = useState('6222 0202 0202 0202 020')
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('13012345678')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <MdField>
              <MdInputItem title="普通文本" placeholder="普通文本" />
              <MdInputItem title="禁用表单" value="禁用表单" disabled />
              <MdInputItem title="只读表单" value="只读表单" readOnly />
            </MdField>
          )
        if (active === 1)
          return (
            <MdField>
              <MdInputItem title="手机号" type="phone" value={phone} onChange={setPhone} placeholder="phone xxx xxxx xxxx" />
              <MdInputItem title="储蓄卡号" type="bankCard" value={bankCardNo} onChange={setBankCardNo} clearable />
            </MdField>
          )
        if (active === 2)
          return (
            <MdField title="转出金额(元)">
              <MdInputItem type="money" value={amount} onChange={setAmount} brief="理财提示文案，字符超出10个自动变小" placeholder="最多30万元" isAmount />
            </MdField>
          )
        if (active === 3)
          return (
            <MdField>
              <MdInputItem title="真实姓名" value="张**" isTitleLatent placeholder="投保人姓名" />
              <MdInputItem title="身份证号" type="bankCard" value="3102**********" isTitleLatent placeholder="投保人身份证号" />
            </MdField>
          )
        if (active === 4)
          return (
            <MdField>
              <MdInputItem type="phone" title="手机号码" value="1999999999999" error="手机号码无效" clearable />
            </MdField>
          )
        return (
          <MdField title="表单控件" right={<MdIcon name="info" />}>
            <MdInputItem title="总余额" value="¥1000.00" readOnly />
          </MdField>
        )
      }}
    </DemoCanvasReact>
  )
}
