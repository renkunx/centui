import { MdIcon } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['常规图标', '彩色图标', '尺寸']
const code = `<MdIcon name="home" size="lg" />
<MdIcon name="success-color" size="lg" />`

export default function IconDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="icons">
              <MdIcon name="home" size="lg" />
              <MdIcon name="location" size="lg" />
              <MdIcon name="arrow" />
              <MdIcon name="close" />
            </div>
          )
        if (active === 1)
          return (
            <div className="icons">
              <MdIcon name="success-color" size="lg" />
              <MdIcon name="warn-color" size="lg" />
              <MdIcon name="fail-color" size="lg" />
            </div>
          )
        return (
          <div className="icons">
            <MdIcon name="home" size="sm" />
            <MdIcon name="home" size="md" />
            <MdIcon name="home" size="lg" />
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
