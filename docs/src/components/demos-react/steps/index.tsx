import { useState } from 'react'
import { MdSteps, MdIcon, MdButton } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '进度非整数', '指定当前步骤', '自定义图标', '进度动效', '完成全部', '纵向展示']
const code = `<MdSteps steps={steps} />
<MdSteps steps={steps} current={1.2} />
<MdSteps steps={steps} current={2} transition />`
const steps = [
  { name: '登录/注册' },
  { name: '申请征信报告' },
  { name: '提取征信报告' },
]
const stepsNonInt = [{ name: '登录' }, { name: '开通' }, { name: '验证' }]

export default function StepsDemo() {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0) return <MdSteps steps={steps} />
        if (active === 1) return <MdSteps steps={stepsNonInt} current={1.2} />
        if (active === 2) return <MdSteps steps={steps} current={2} />
        if (active === 3)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%' }}>
              <MdSteps
                steps={steps}
                current={2}
                renderIcon={({ index, currentIndex }) =>
                  index === currentIndex ? (
                    <b style={{ color: '#198cff' }}>{index}</b>
                  ) : (
                    <span>{index}</span>
                  )
                }
              />
              <MdSteps
                steps={steps}
                current={2}
                renderReached={({ index }) =>
                  index === 1 ? (
                    <MdIcon name="checked" />
                  ) : (
                    <div className="step-node-default">
                      <div className="step-node-default-icon" style={{ width: 6, height: 6, borderRadius: '50%' }} />
                    </div>
                  )
                }
                renderCurrent={() => <MdIcon name="location" />}
                renderUnreached={() => <MdIcon name="time" />}
              />
            </div>
          )
        if (active === 4)
          return (
            <div style={{ width: '100%' }}>
              <MdSteps steps={steps} current={currentStep} transition />
              <MdButton
                size="small"
                inline
                onClick={() => setCurrentStep(2)}
              >
                current = 2
              </MdButton>
            </div>
          )
        if (active === 5) return <MdSteps steps={steps} current={3} />
        return <MdSteps steps={steps} current={1} direction="vertical" />
      }}
    </DemoCanvasReact>
  )
}
