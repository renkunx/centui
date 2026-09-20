import { useState } from 'react'
import { CuRadio, CuRadioGroup, CuRadioBox, CuRadioList, CuField } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['普通单选项', '单选项组', '列表模式', '带输入项', '单选框']
const code = `<CuRadio name="0" value={checked} onChange={setChecked} label="单选项1" />
<CuRadioGroup value={favorites} onChange={setFavorites}>
  <CuRadio name="apple" label="苹果" />
</CuRadioGroup>
<CuRadioList value={myBank} onChange={setMyBank} options={banks} />`
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
              <CuRadio name="0" value={checked} onChange={setChecked} label="单选项1" />
              <CuRadio name="1" value={checked} onChange={setChecked} label="单选项2" />
            </div>
          )
        if (active === 1)
          return (
            <CuRadioGroup value={favorites} onChange={setFavorites}>
              <CuRadio name="watermelon" label="西瓜" />
              <CuRadio name="apple" label="苹果" />
              <CuRadio name="banana" label="香蕉" />
              <CuRadio name="orange" label="橙子" />
              <CuRadio name="tomato" label="西红柿" disabled />
            </CuRadioGroup>
          )
        if (active === 2)
          return (
            <CuField title="简单选择列表">
              <CuRadioList value={myBank} onChange={setMyBank} options={banks} iconSize="lg" />
            </CuField>
          )
        if (active === 3)
          return (
            <CuField title="输入项">
              <CuRadioList
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
            </CuField>
          )
        return (
          <CuRadioGroup value={favorites} onChange={setFavorites}>
            <CuRadioBox name="watermelon">西瓜</CuRadioBox>
            <CuRadioBox name="apple">苹果</CuRadioBox>
            <CuRadioBox name="banana" disabled>香蕉</CuRadioBox>
          </CuRadioGroup>
        )
      }}
    </DemoCanvasReact>
  )
}
