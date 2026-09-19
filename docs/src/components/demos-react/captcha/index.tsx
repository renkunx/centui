import { useState } from 'react'
import { MdCaptcha } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['内联验证码']
const code = `<MdCaptcha isView title="输入验证码" brief="验证码已发送至 138****1234" />`

export default function CaptchaDemo() {
  const [submitted, setSubmitted] = useState('')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {() => (
        <div className="captcha-demo">
          <MdCaptcha
            isView
            title="输入验证码"
            brief="验证码已发送至 138****1234"
            maxlength={4}
            onSubmit={code => setSubmitted(code)}
          >
            短信验证码已发送
          </MdCaptcha>
          {submitted ? <p className="captcha-demo-result">已提交：{submitted}</p> : null}
        </div>
      )}
    </DemoCanvasReact>
  )
}
