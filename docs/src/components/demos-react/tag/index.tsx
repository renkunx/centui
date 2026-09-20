import { MdTag } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['圆角', '半圆', '线框', '阳文', '特殊标签']
const code = `<MdTag size="small" shape="circle" type="fill" fillColor="#FC7353" fontColor="#fff">特惠</MdTag>
<MdTag size="large" shape="fillet" type="fill" fontColor="#FF5B60">逾期23天</MdTag>
<MdTag shape="coupon" fillColor="#FC9153">免息券70.1</MdTag>`

export default function TagDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <MdTag size="tiny" shape="circle" type="fill" fillColor="#FC7353" fontColor="#000" />
              <MdTag size="small" shape="circle" type="fill" fillColor="#FC7353" fontColor="#fff">特惠</MdTag>
              <MdTag size="large" shape="circle" type="fill" fillColor="#FC7353" fontColor="#fff">返5000</MdTag>
              <MdTag size="small" shape="circle" type="ghost" fontColor="#FC7353">特惠</MdTag>
              <MdTag size="small" shape="circle" sharp="bottom-left" type="fill" fillColor="linear-gradient(90deg, #FC7353 0%, #FC9153 100%)" fontColor="#fff">续保3折起</MdTag>
            </div>
          )
        if (active === 1)
          return (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <MdTag size="large" shape="fillet" type="fill" fillColor="rgba(255, 91, 96, .1)" fontWeight="normal" fontColor="#FF5B60">逾期23天</MdTag>
              <MdTag size="large" shape="fillet" type="ghost" fontColor="#FF5B60">逾期23天</MdTag>
            </div>
          )
        if (active === 2)
          return (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <MdTag size="large" shape="square" fontColor="#FF8843" type="ghost">可选</MdTag>
              <MdTag size="small" shape="square" fontColor="#28AA91" type="ghost">可选</MdTag>
            </div>
          )
        if (active === 3)
          return (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <MdTag size="large" shape="square" fillColor="rgba(0,0,0,0)" type="fill" fontWeight="bolder" fontColor="#333">￥3600</MdTag>
              <MdTag size="small" shape="square" fillColor="rgba(0,0,0,0)" type="fill" fontWeight="bolder" fontColor="#333">￥300</MdTag>
            </div>
          )
        return (
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <MdTag size="large" shape="coupon" fillColor="#FC9153" type="fill" fontColor="#fff">免息券70.1</MdTag>
            <MdTag size="large" shape="quarter" fillColor="#FC9153" type="fill" fontColor="#fff">免息券</MdTag>
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
