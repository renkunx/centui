import { useState } from 'react'
import { MdButton, MdDialog, Dialog } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['确认对话框', '警告对话框', '成功/失败', '单例模式']
const code = `Dialog.confirm({ title: '确认', onConfirm })
Dialog.succeed({ title: '成功', content: '操作成功' })
MdDialog 组件式用法见右图`

export default function DialogDemo() {
  const [show, setShow] = useState(false)
  const [iconShow, setIconShow] = useState(false)

  return (
    <DemoCanvasReact mode="phone" scenes={scenes} code={code}>
      {active => (
        <div style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {active === 0 ? (
            <>
              <MdButton size="small" inline onClick={() => setShow(true)}>组件式对话框</MdButton>
              <MdButton
                size="small"
                inline
                onClick={() =>
                  Dialog.confirm({ title: '警告', content: '确认删除该项？', onConfirm: () => setShow(false) })
                }
              >
                命令式 confirm
              </MdButton>
              <MdDialog
                value={show}
                title="对话框"
                content="这是一个 React 对话框"
                btns={[
                  { text: '取消', handler: () => setShow(false) },
                  { text: '确定', warning: true, handler: () => setShow(false) },
                ]}
                onChange={setShow}
              />
            </>
          ) : active === 1 ? (
            <MdButton
              size="small"
              inline
              onClick={() =>
                Dialog.alert({ title: '警告', content: '警告弹窗', confirmText: '知道了' })
              }
            >
              警告弹窗
            </MdButton>
          ) : active === 2 ? (
            <>
              <MdButton size="small" inline onClick={() => setIconShow(true)}>成功弹窗</MdButton>
              <MdDialog
                value={iconShow}
                icon="success-color"
                iconSvg
                title="支付成功"
                content="您的订单已完成支付"
                btns={[{ text: '知道了', handler: () => setIconShow(false) }]}
                onChange={setIconShow}
              />
            </>
          ) : (
            <>
              <MdButton size="small" inline onClick={() => Dialog.succeed({ title: '成功', content: '操作成功' })}>
                成功弹窗
              </MdButton>
              <MdButton size="small" inline onClick={() => Dialog.failed({ title: '失败', content: '操作失败' })}>
                失败弹窗
              </MdButton>
            </>
          )}
        </div>
      )}
    </DemoCanvasReact>
  )
}
