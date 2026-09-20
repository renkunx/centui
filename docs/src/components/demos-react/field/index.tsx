import { CuField, CuInputItem } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['分组表单', '禁用']
const code = `<CuField title="用户信息">
  <CuInputItem title="姓名" />
</CuField>`

export default function FieldDemo() {
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <CuField title="用户信息" brief="请填写真实信息">
            <CuInputItem title="姓名" placeholder="请输入姓名" />
            <CuInputItem title="手机号" type="phone" placeholder="请输入手机号" />
          </CuField>
        ) : (
          <CuField title="只读信息" disabled>
            <CuInputItem title="编号" value="MD-2024-001" />
          </CuField>
        )
      }
    </DemoCanvasReact>
  )
}
