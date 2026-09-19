import { MdActionBar, type ActionBarAction } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['单个按钮', '双按钮', '含文本', '禁用']
const code = `<MdActionBar actions={actions} />
<MdActionBar actions={actions}>文本区域</MdActionBar>`
const single: ActionBarAction[] = [{ text: '主要按钮' }]
const double: ActionBarAction[] = [{ text: '次要按钮' }, { text: '主要按钮' }]
const disabled: ActionBarAction[] = [{ text: '禁用按钮', disabled: true }]
const relative = { position: 'relative' as const }

export default function ActionBarDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <MdActionBar actions={single} style={relative} />
        if (active === 1) return <MdActionBar actions={double} style={relative} />
        if (active === 2)
          return (
            <MdActionBar actions={double} style={relative}>
              <p style={{ fontSize: 24, color: '#999' }}>
                合计：<b style={{ color: '#111' }}>¥128.00</b>
              </p>
            </MdActionBar>
          )
        return <MdActionBar actions={disabled} style={relative} />
      }}
    </DemoCanvasReact>
  )
}
