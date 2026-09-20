import { CuNoticeBar, CuIcon } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '设置图标', '定时隐藏', '圆角', '主题样式', '多行显示', '滚动播放', '自定义插槽']
const code = `<CuNoticeBar>为了确保您的资金安全，请设置支付密码</CuNoticeBar>
<CuNoticeBar mode="closable" icon="security">...</CuNoticeBar>
<CuNoticeBar round>...</CuNoticeBar>
<CuNoticeBar multiRows>...</CuNoticeBar>
<CuNoticeBar scrollable>...</CuNoticeBar>`

export default function NoticeBarDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return <CuNoticeBar>为了确保您的资金安全，请设置支付密码</CuNoticeBar>
        if (active === 1)
          return <CuNoticeBar mode="closable" icon="security">为了确保您的资金安全，请设置支付密码</CuNoticeBar>
        if (active === 2)
          return <CuNoticeBar time={5000}>为了确保您的资金安全，请设置支付密码（5s 后隐藏）</CuNoticeBar>
        if (active === 3)
          return <CuNoticeBar round>为了确保您的资金安全，请设置支付密码</CuNoticeBar>
        if (active === 4)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <CuNoticeBar icon="warn" mode="closable" type="warning">
                该银行3:00-12:00系统维护，请更换其他银行卡
              </CuNoticeBar>
              <CuNoticeBar icon="coupon" mode="link" type="activity">
                福利来啦，7日免息券发放中！
              </CuNoticeBar>
            </div>
          )
        if (active === 5)
          return (
            <CuNoticeBar mode="link" icon="security" multiRows>
              为了确保您的资金安全，请设置支付密码。为了确保您的资金安全，请设置支付密码。为了确保您的资金安全，请设置支付密码。
            </CuNoticeBar>
          )
        if (active === 6)
          return (
            <CuNoticeBar mode="closable" icon="volumn" scrollable>
              为了确保您的资金安全，请设置支付密码为了确保您的资金安全，请设置支付密码为了确保您的资金安全，请设置支付密码
            </CuNoticeBar>
          )
        return (
          <CuNoticeBar left={<CuIcon name="security" style={{ marginRight: 8 }} />}>
            为了确保您的资金安全，请设置支付密码
          </CuNoticeBar>
        )
      }}
    </DemoCanvasReact>
  )
}
