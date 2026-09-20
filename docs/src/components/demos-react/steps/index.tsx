import { useState } from 'react'
import { CuSteps, CuIcon, CuButton } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['基础', '进度非整数', '指定当前步骤', '自定义图标', '进度动效', '完成全部', '纵向展示']
const code = `<CuSteps steps={steps} />
<CuSteps steps={steps} current={1.2} />
<CuSteps steps={steps} current={2} transition />`
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
        if (active === 0) return <CuSteps steps={steps} />
        if (active === 1) return <CuSteps steps={stepsNonInt} current={1.2} />
        if (active === 2) return <CuSteps steps={steps} current={2} />
        if (active === 3)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%' }}>
              <CuSteps
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
              <CuSteps
                steps={steps}
                current={2}
                renderReached={({ index }) =>
                  index === 1 ? (
                    <CuIcon name="checked" />
                  ) : (
                    <div className="step-node-default">
                      <div className="step-node-default-icon" style={{ width: 6, height: 6, borderRadius: '50%' }} />
                    </div>
                  )
                }
                renderCurrent={() => <CuIcon name="location" />}
                renderUnreached={() => <CuIcon name="time" />}
              />
            </div>
          )
        if (active === 4)
          return (
            <div style={{ width: '100%' }}>
              <CuSteps steps={steps} current={currentStep} transition />
              <CuButton
                size="small"
                inline
                onClick={() => setCurrentStep(2)}
              >
                current = 2
              </CuButton>
            </div>
          )
        if (active === 5) return <CuSteps steps={steps} current={3} />
        return <CuSteps steps={steps} current={1} direction="vertical" />
      }}
    </DemoCanvasReact>
  )
}
