import { useState } from 'react'
import { CuCaptcha, CuButton } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['内联', '半屏弹层', '对话框']
const code = `<CuCaptcha isView title="输入验证码" brief="验证码已发送至 138****1234" />
<CuCaptcha value={showHalf} onChange={setShowHalf} type="halfScreen" />
<CuCaptcha value={showDialog} onChange={setShowDialog} type="dialog" />`

export default function CaptchaDemo() {
  const [submitted, setSubmitted] = useState('')
  const [showHalf, setShowHalf] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="captcha-demo">
              <CuCaptcha
                isView
                title="输入验证码"
                brief="验证码已发送至 138****1234"
                maxlength={4}
                onSubmit={code => setSubmitted(code)}
              >
                短信验证码已发送
              </CuCaptcha>
              {submitted ? <p className="captcha-demo-result">已提交：{submitted}</p> : null}
            </div>
          )
        if (active === 1)
          return (
            <div className="captcha-demo">
              <CuButton type="primary" inline round onClick={() => setShowHalf(true)}>
                打开半屏验证
              </CuButton>
              <CuCaptcha
                value={showHalf}
                onChange={setShowHalf}
                type="halfScreen"
                title="输入验证码"
                subtitle="用于核验信息有效性及确定本人操作"
                brief="验证码已发送至 138****1234"
                maxlength={4}
              >
                输入短信验证码 完成验证
              </CuCaptcha>
            </div>
          )
        return (
          <div className="captcha-demo">
            <CuButton type="primary" inline round onClick={() => setShowDialog(true)}>
              打开对话框验证
            </CuButton>
            <CuCaptcha
              value={showDialog}
              onChange={setShowDialog}
              type="dialog"
              title="输入验证码"
              brief="验证码已发送至 138****1234"
              maxlength={4}
            >
              短信验证码已发送
            </CuCaptcha>
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
