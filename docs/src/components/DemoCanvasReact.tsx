import { useState, type ReactNode } from 'react'

export interface DemoCanvasReactProps {
  scenes: string[]
  code?: string
  mode?: 'phone' | 'stage'
  minHeight?: number
  /** 渲染第 active 个场景（render-prop 对齐 Vue 版作用域插槽） */
  children: (active: number) => ReactNode
}

/** React 版演示画布：与 Vue 版 DemoCanvas 同一套全局样式（demo-stage/phone-frame）。 */
export default function DemoCanvasReact({
  scenes,
  code = '',
  mode = 'phone',
  minHeight = 0,
  children,
}: DemoCanvasReactProps) {
  const [active, setActive] = useState(0)

  return (
    <div className="demo-canvas">
      {mode === 'phone' ? (
        <div className="demo-canvas__frame">
          <div
            className="phone-frame"
            style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
          >
            <div className="phone-frame__screen">
              <div className="phone-frame__viewport">{children(active)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="demo-stage"
          style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
        >
          {children(active)}
        </div>
      )}

      {scenes.length > 1 ? (
        <div className="demo-switcher">
          {scenes.map((s, i) => (
            <button
              key={i}
              type="button"
              className={i === active ? 'is-active' : ''}
              onClick={() => setActive(i)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {code ? (
        <pre className="demo-code">
          <code>{code}</code>
        </pre>
      ) : null}
    </div>
  )
}
