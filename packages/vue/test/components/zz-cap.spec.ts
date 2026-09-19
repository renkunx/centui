import { mount } from '@vue/test-utils'
import { it } from 'vitest'
import { MdCaptcha } from '../../src'

it('captcha inline probe', () => {
  const w = mount(MdCaptcha, {
    props: { isView: true, title: '输入验证码', brief: '验证码已发送至 138****1234', maxlength: 4 },
    slots: { default: '短信验证码已发送' },
  })
  const html = w.html()
  const hasDialog = html.includes('md-dialog')
  const type = w.props().type
  process.stdout.write(`RESULT type=${JSON.stringify(type)} hasDialog=${hasDialog} len=${html.length} tail=${html.slice(-140).replace(/\n/g, '')}\n`)
})
