import { useState } from 'react'
import { MdCheck, MdCheckBox, MdCheckGroup, MdCheckList, MdField, MdButton, MdCellItem } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['复选项', '复选项组', '复选框', '复选框组', '复选列表', '图标左置']
const code = `<MdCheck value={checked} onChange={setChecked} label="复选项" />
<MdCheckGroup value={favorites} onChange={setFavorites}>
  <MdCheck name="apple" label="苹果" />
</MdCheckGroup>
<MdCheckBox name="month" value={pay} onChange={setPay} label="月付" />`
const fruits = [
  { value: 'apple', text: '苹果' },
  { value: 'banana', text: '香蕉' },
  { value: 'orange', text: '橙子' },
]

export default function CheckDemo() {
  const [checked, setChecked] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(['apple'])
  const [pay, setPay] = useState('')
  const [insurants, setInsurants] = useState<string[]>(['self', 'couple'])
  const [checkListFav, setCheckListFav] = useState<string[]>(['apple'])

  const checkAll = () => setCheckListFav(fruits.map(f => f.value))
  const toggleAll = () => setCheckListFav(checkListFav.length ? [] : fruits.map(f => f.value))

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <MdCheck value={checked} onChange={setChecked} label="复选项" />
              <MdCheck label="禁用" disabled />
            </div>
          )
        if (active === 1)
          return (
            <MdCheckGroup value={favorites} onChange={setFavorites}>
              <MdCheck name="watermelon" label="西瓜" />
              <MdCheck name="apple" label="苹果" />
              <MdCheck name="banana" label="香蕉" />
              <MdCheck name="orange" label="橙子" />
              <MdCheck name="tomato" label="西红柿" disabled />
            </MdCheckGroup>
          )
        if (active === 2)
          return (
            <div style={{ display: 'flex', gap: 24 }}>
              <MdCheckBox name="day" value={pay} onChange={setPay} label="日缴" disabled />
              <MdCheckBox name="month" value={pay} onChange={setPay} label="月付" />
              <MdCheckBox name="season" value={pay} onChange={setPay} label="季度费" />
            </div>
          )
        if (active === 3)
          return (
            <MdCheckGroup value={insurants} onChange={setInsurants}>
              <MdCheckBox iconPosition="lt" name="self" disabled>自己</MdCheckBox>
              <MdCheckBox iconPosition="rt" name="couple" disabled>配偶</MdCheckBox>
              <MdCheckBox iconPosition="lt" name="parent">父母</MdCheckBox>
              <MdCheckBox iconPosition="rt" name="child">子女</MdCheckBox>
            </MdCheckGroup>
          )
        if (active === 4)
          return (
            <MdField title="复选列表">
              <MdCheckList value={checkListFav} onChange={setCheckListFav} icon="right" iconInverse="" options={fruits} />
              <MdCellItem noBorder>
                <MdButton type="primary" size="small" inline onClick={checkAll}>全选</MdButton>
                <MdButton size="small" inline onClick={toggleAll}>反选</MdButton>
              </MdCellItem>
            </MdField>
          )
        return (
          <MdField title="复选列表">
            <MdCheckList value={checkListFav} onChange={setCheckListFav} iconPosition="left" options={fruits} />
          </MdField>
        )
      }}
    </DemoCanvasReact>
  )
}
