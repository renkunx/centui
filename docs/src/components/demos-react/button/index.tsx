import { MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['默认', '主要', '禁用', '圆角', '朴素警告', '加载']
const code = `<MdButton type="primary" round>主要按钮</MdButton>
<MdButton type="warning" plain disabled>次要按钮</MdButton>`

export default function ButtonDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <MdButton>默认按钮</MdButton>
        if (active === 1) return <MdButton type="primary">主要按钮</MdButton>
        if (active === 2)
          return (
            <>
              <MdButton type="primary" disabled>主要按钮</MdButton>
              <MdButton disabled>默认按钮</MdButton>
            </>
          )
        if (active === 3) return <MdButton type="primary" round>主要按钮</MdButton>
        if (active === 4) return <MdButton type="warning" plain>次要按钮</MdButton>
        return <MdButton type="primary" loading>加载中</MdButton>
      }}
    </DemoCanvasReact>
  )
}
