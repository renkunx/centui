import { MdNoticeBar } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '可关闭', '链接']
const code = `<MdNoticeBar>为了确保你的资金安全，请设置支付密码</MdNoticeBar>
<MdNoticeBar mode="closable">...</MdNoticeBar>`

export default function NoticeBarDemo() {
  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active =>
        active === 0 ? (
          <MdNoticeBar>为了确保你的资金安全，请设置支付密码</MdNoticeBar>
        ) : active === 1 ? (
          <MdNoticeBar mode="closable">为了确保你的资金安全，请设置支付密码</MdNoticeBar>
        ) : (
          <MdNoticeBar mode="link">查看详情</MdNoticeBar>
        )
      }
    </DemoCanvasReact>
  )
}
