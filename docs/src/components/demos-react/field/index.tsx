import { MdField, MdInputItem } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['分组表单', '禁用']
const code = `<MdField title="用户信息">
  <MdInputItem title="姓名" />
</MdField>`

export default function FieldDemo() {
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <MdField title="用户信息" brief="请填写真实信息">
            <MdInputItem title="姓名" placeholder="请输入姓名" />
            <MdInputItem title="手机号" type="phone" placeholder="请输入手机号" />
          </MdField>
        ) : (
          <MdField title="只读信息" disabled>
            <MdInputItem title="编号" value="MD-2024-001" />
          </MdField>
        )
      }
    </DemoCanvasReact>
  )
}
