import { useState } from 'react'
import { MdRadio, MdRadioGroup, MdRadioBox, MdRadioList, MdField } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['普通单选项', '单选项组', '列表模式', '带输入项', '单选框']
const code = `<MdRadio name="0" value={checked} onChange={setChecked} label="单选项1" />
<MdRadioGroup value={favorites} onChange={setFavorites}>
  <MdRadio name="apple" label="苹果" />
</MdRadioGroup>
<MdRadioList value={myBank} onChange={setMyBank} options={banks} />`
const banks = [
  { value: '0', text: '中国农业银行' },
  { value: '1', text: '招商银行' },
  { value: '3', text: '其他' },
]
const reasons = [
  { value: '0', text: '不准确' },
  { value: '1', text: '不完整' },
  { value: '2', text: '其他' },
]

export default function RadioDemo() {
  const [checked, setChecked] = useState('0')
  const [favorites, setFavorites] = useState('apple')
  const [myBank, setMyBank] = useState('1')
  const [myReason, setMyReason] = useState('')

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <MdRadio name="0" value={checked} onChange={setChecked} label="单选项1" />
              <MdRadio name="1" value={checked} onChange={setChecked} label="单选项2" />
            </div>
          )
        if (active === 1)
          return (
            <MdRadioGroup value={favorites} onChange={setFavorites}>
              <MdRadio name="watermelon" label="西瓜" />
              <MdRadio name="apple" label="苹果" />
              <MdRadio name="banana" label="香蕉" />
              <MdRadio name="orange" label="橙子" />
              <MdRadio name="tomato" label="西红柿" disabled />
            </MdRadioGroup>
          )
        if (active === 2)
          return (
            <MdField title="简单选择列表">
              <MdRadioList value={myBank} onChange={setMyBank} options={banks} iconSize="lg" />
            </MdField>
          )
        if (active === 3)
          return (
            <MdField title="输入项">
              <MdRadioList
                value={myReason}
                onChange={setMyReason}
                options={reasons}
                icon="right"
                iconInverse=""
                iconDisabled=""
                iconPosition="right"
                hasInput
                inputLabel="其他"
                inputPlaceholder="请输入原因"
              />
            </MdField>
          )
        return (
          <MdRadioGroup value={favorites} onChange={setFavorites}>
            <MdRadioBox name="watermelon">西瓜</MdRadioBox>
            <MdRadioBox name="apple">苹果</MdRadioBox>
            <MdRadioBox name="banana" disabled>香蕉</MdRadioBox>
          </MdRadioGroup>
        )
      }}
    </DemoCanvasReact>
  )
}
