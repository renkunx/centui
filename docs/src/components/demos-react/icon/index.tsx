import { MdIcon } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['字体图标', 'SVG 图标', '大小', '颜色']
const code = `<MdIcon name={icon} size="lg" />
<MdIcon name={icon} size="lg" svg />
<MdIcon name="location" size="xs|sm|md|lg" />
<MdIcon name="security" color="orange" />`
const iconList = [
  'square-checked', 'square-check', 'rectangle', 'right', 'wrong', 'arrow',
  'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down', 'invisible', 'visible',
  'service', 'setting', 'close', 'refresh', 'edit', 'sort', 'info', 'question',
  'security', 'rmb', 'wait', 'check', 'checked', 'check-disabled', 'clear',
  'success', 'fail', 'location', 'calendar', 'user', 'bank-zs', 'bank-ny',
]
const sizes = ['xs', 'sm', 'md', 'lg']
const colors = ['gray', 'orange', 'blue', 'green', 'red']

export default function IconDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="icon-demo-grid">
              {iconList.map(icon => (
                <div key={icon} className="icon-demo-item">
                  <MdIcon name={icon.split('/')[0]} size="lg" />
                  <p>{icon}</p>
                </div>
              ))}
            </div>
          )
        if (active === 1)
          return (
            <div className="icon-demo-grid">
              {['spinner', 'warn-color', 'success-color', 'checked'].map(icon => (
                <div key={icon} className="icon-demo-item">
                  <MdIcon name={icon} size="lg" svg />
                  <p>{icon}</p>
                </div>
              ))}
            </div>
          )
        if (active === 2)
          return (
            <div className="icon-demo-grid">
              {sizes.map(s => (
                <div key={s} className="icon-demo-item">
                  <MdIcon name="location" size={s} />
                  <p>{s}</p>
                </div>
              ))}
            </div>
          )
        return (
          <div className="icon-demo-grid">
            {colors.map(c => (
              <div key={c} className="icon-demo-item">
                <MdIcon name="security" color={c} />
                <p>{c}</p>
              </div>
            ))}
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
