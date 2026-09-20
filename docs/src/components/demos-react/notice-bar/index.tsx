import { MdNoticeBar, MdIcon } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '设置图标', '定时隐藏', '圆角', '主题样式', '多行显示', '滚动播放', '自定义插槽']
const code = `<MdNoticeBar>为了确保您的资金安全，请设置支付密码</MdNoticeBar>
<MdNoticeBar mode="closable" icon="security">...</MdNoticeBar>
<MdNoticeBar round>...</MdNoticeBar>
<MdNoticeBar multiRows>...</MdNoticeBar>
<MdNoticeBar scrollable>...</MdNoticeBar>`

export default function NoticeBarDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return <MdNoticeBar>为了确保您的资金安全，请设置支付密码</MdNoticeBar>
        if (active === 1)
          return <MdNoticeBar mode="closable" icon="security">为了确保您的资金安全，请设置支付密码</MdNoticeBar>
        if (active === 2)
          return <MdNoticeBar time={5000}>为了确保您的资金安全，请设置支付密码（5s 后隐藏）</MdNoticeBar>
        if (active === 3)
          return <MdNoticeBar round>为了确保您的资金安全，请设置支付密码</MdNoticeBar>
        if (active === 4)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <MdNoticeBar icon="warn" mode="closable" type="warning">
                该银行3:00-12:00系统维护，请更换其他银行卡
              </MdNoticeBar>
              <MdNoticeBar icon="coupon" mode="link" type="activity">
                福利来啦，7日免息券发放中！
              </MdNoticeBar>
            </div>
          )
        if (active === 5)
          return (
            <MdNoticeBar mode="link" icon="security" multiRows>
              为了确保您的资金安全，请设置支付密码。为了确保您的资金安全，请设置支付密码。为了确保您的资金安全，请设置支付密码。
            </MdNoticeBar>
          )
        if (active === 6)
          return (
            <MdNoticeBar mode="closable" icon="volumn" scrollable>
              为了确保您的资金安全，请设置支付密码为了确保您的资金安全，请设置支付密码为了确保您的资金安全，请设置支付密码
            </MdNoticeBar>
          )
        return (
          <MdNoticeBar left={<MdIcon name="security" style={{ marginRight: 8 }} />}>
            为了确保您的资金安全，请设置支付密码
          </MdNoticeBar>
        )
      }}
    </DemoCanvasReact>
  )
}
