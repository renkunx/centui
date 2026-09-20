import { CuButton } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['默认', '主要', '禁用', '圆角', '朴素警告', '加载']
const code = `<CuButton type="primary" round>主要按钮</CuButton>
<CuButton type="warning" plain disabled>次要按钮</CuButton>`

export default function ButtonDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <CuButton>默认按钮</CuButton>
        if (active === 1) return <CuButton type="primary">主要按钮</CuButton>
        if (active === 2)
          return (
            <>
              <CuButton type="primary" disabled>主要按钮</CuButton>
              <CuButton disabled>默认按钮</CuButton>
            </>
          )
        if (active === 3) return <CuButton type="primary" round>主要按钮</CuButton>
        if (active === 4) return <CuButton type="warning" plain>次要按钮</CuButton>
        return <CuButton type="primary" loading>加载中</CuButton>
      }}
    </DemoCanvasReact>
  )
}
