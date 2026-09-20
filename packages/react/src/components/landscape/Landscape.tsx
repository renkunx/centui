import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react'
import { CuPopup } from '../popup/Popup'
import { CuIcon } from '../icon/Icon'

export interface LandscapeProps {
  value?: boolean
  scroll?: boolean
  fullScreen?: boolean
  hasMask?: boolean
  maskClosable?: boolean
  transition?: string
  children?: ReactNode
  onShow?: () => void
  onHide?: () => void
}

export const CuLandscape = forwardRef<HTMLDivElement, LandscapeProps>(function CuLandscape(
  { value = false, scroll = false, fullScreen = false, hasMask = true, maskClosable = false, transition, children, onShow, onHide },
  ref,
) {
  const [isLandscapeShow, setIsLandscapeShow] = useState(value)

  // v2 watch value
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      setIsLandscapeShow(value)
    }
  }, [value])

  // v2 契约：默认过渡按 fullScreen 区分（cu-fade / cu-punch）
  const actualTransition = transition ?? (fullScreen ? 'cu-fade' : 'cu-punch')

  return (
    <div className={`cu-landscape${fullScreen ? ' is-full' : ''}`} ref={ref}>
      <CuPopup
        value={isLandscapeShow}
        maskClosable={maskClosable}
        preventScroll
        preventScrollExclude=".cu-landscape-content"
        hasMask={!fullScreen && hasMask}
        transition={actualTransition}
        onChange={(val) => {
          setIsLandscapeShow(val)
        }}
        onShow={onShow}
        onHide={onHide}
      >
        <div className={`cu-landscape-body${scroll ? ' scroll' : ''}`}>
          <div className="cu-landscape-content">{children}</div>
          <CuIcon
            className={`cu-landscape-close${!hasMask || fullScreen ? ' dark' : ''}`}
            name={fullScreen ? 'clear' : 'close'}
            onClick={() => setIsLandscapeShow(false)}
          />
        </div>
      </CuPopup>
    </div>
  )
})
