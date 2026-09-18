import { MdButton, Toast } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['预设', '带图标']
const code = `Toast.info('提示')
Toast.succeed('成功')
Toast.failed('失败')
Toast.loading('加载中')`

export default function ToastDemo() {
  return (
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
      {active => (
        <div style={{ display: 'flex', gap: 12 }}>
          {active === 0 ? (
            <>
              <MdButton size="small" inline onClick={() => Toast.info('提示')}>info</MdButton>
              <MdButton size="small" inline onClick={() => Toast.succeed('成功')}>succeed</MdButton>
              <MdButton size="small" inline onClick={() => Toast.failed('失败')}>failed</MdButton>
            </>
          ) : (
            <>
              <MdButton size="small" inline onClick={() => Toast.loading('加载中')}>loading</MdButton>
              <MdButton size="small" inline onClick={() => Toast.hide()}>hide</MdButton>
            </>
          )}
        </div>
      )}
    </DemoCanvasReact>
  )
}
