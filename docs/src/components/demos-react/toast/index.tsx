import { useState } from 'react'
import { Toast, CuButton, CuToast, CuActivityIndicator } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['纯文字', '成功/失败', '载入', '长文字', '位置', '连续调用', '定制/方形']
const code = `Toast.info('一段文字')
Toast.succeed('操作成功')
Toast.loading('加载中...')
Toast({ content: '自定义位置', position: 'bottom' })`

export default function ToastDemo() {
  const [customShow, setCustomShow] = useState(false)
  const [squareShow, setSquareShow] = useState(false)

  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return <CuButton onClick={() => Toast.info('一段文字')}>纯文字</CuButton>
        if (active === 1)
          return (
            <div style={{ display: 'flex', gap: 16 }}>
              <CuButton onClick={() => Toast.succeed('操作成功')}>成功</CuButton>
              <CuButton onClick={() => Toast.failed('操作失败')}>失败</CuButton>
            </div>
          )
        if (active === 2)
          return (
            <CuButton
              onClick={() => {
                Toast.loading('加载中...')
                setTimeout(() => Toast.hide(), 2000)
              }}
            >
              载入
            </CuButton>
          )
        if (active === 3)
          return <CuButton onClick={() => Toast.succeed('所有文案部分字数最多展示15个字')}>长文字</CuButton>
        if (active === 4)
          return (
            <CuButton onClick={() => Toast({ content: '自定义位置', position: 'bottom' })}>自定义位置</CuButton>
          )
        if (active === 5)
          return (
            <CuButton
              onClick={() => {
                Toast.loading('加载中...')
                setTimeout(() => Toast.succeed('加载完成'), 1500)
              }}
            >
              连续调用
            </CuButton>
          )
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <CuButton onClick={() => setCustomShow(!customShow)}>定制 Toast</CuButton>
            {customShow ? (
              <CuToast style={{ position: 'relative' }}>
                <CuActivityIndicator size={20} textSize={16} color="yellow" textColor="white">
                  loading...
                </CuActivityIndicator>
              </CuToast>
            ) : null}
            <CuButton onClick={() => setSquareShow(!squareShow)}>方形 Toast</CuButton>
            {squareShow ? (
              <CuToast icon="ring" iconSvg content="方形 Toast" square style={{ position: 'relative' }} />
            ) : null}
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
