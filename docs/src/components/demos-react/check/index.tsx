import { useState } from 'react'
import { CuCheck, CuCheckBox, CuCheckGroup, CuCheckList, CuField, CuButton, CuCellItem } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['复选项', '复选项组', '复选框', '复选框组', '复选列表', '图标左置']
const code = `<CuCheck value={checked} onChange={setChecked} label="复选项" />
<CuCheckGroup value={favorites} onChange={setFavorites}>
  <CuCheck name="apple" label="苹果" />
</CuCheckGroup>
<CuCheckBox name="month" value={pay} onChange={setPay} label="月付" />`
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
              <CuCheck value={checked} onChange={setChecked} label="复选项" />
              <CuCheck label="禁用" disabled />
            </div>
          )
        if (active === 1)
          return (
            <CuCheckGroup value={favorites} onChange={setFavorites}>
              <CuCheck name="watermelon" label="西瓜" />
              <CuCheck name="apple" label="苹果" />
              <CuCheck name="banana" label="香蕉" />
              <CuCheck name="orange" label="橙子" />
              <CuCheck name="tomato" label="西红柿" disabled />
            </CuCheckGroup>
          )
        if (active === 2)
          return (
            <div style={{ display: 'flex', gap: 24 }}>
              <CuCheckBox name="day" value={pay} onChange={setPay} label="日缴" disabled />
              <CuCheckBox name="month" value={pay} onChange={setPay} label="月付" />
              <CuCheckBox name="season" value={pay} onChange={setPay} label="季度费" />
            </div>
          )
        if (active === 3)
          return (
            <CuCheckGroup value={insurants} onChange={setInsurants}>
              <CuCheckBox iconPosition="lt" name="self" disabled>自己</CuCheckBox>
              <CuCheckBox iconPosition="rt" name="couple" disabled>配偶</CuCheckBox>
              <CuCheckBox iconPosition="lt" name="parent">父母</CuCheckBox>
              <CuCheckBox iconPosition="rt" name="child">子女</CuCheckBox>
            </CuCheckGroup>
          )
        if (active === 4)
          return (
            <CuField title="复选列表">
              <CuCheckList value={checkListFav} onChange={setCheckListFav} icon="right" iconInverse="" options={fruits} />
              <CuCellItem noBorder>
                <CuButton type="primary" size="small" inline onClick={checkAll}>全选</CuButton>
                <CuButton size="small" inline onClick={toggleAll}>反选</CuButton>
              </CuCellItem>
            </CuField>
          )
        return (
          <CuField title="复选列表">
            <CuCheckList value={checkListFav} onChange={setCheckListFav} iconPosition="left" options={fruits} />
          </CuField>
        )
      }}
    </DemoCanvasReact>
  )
}
