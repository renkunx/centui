import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react'
import { MdPopup } from '../popup/Popup'
import { MdIcon } from '../icon/Icon'

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

export const MdLandscape = forwardRef<HTMLDivElement, LandscapeProps>(function MdLandscape(
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

  // v2 契约：默认过渡按 fullScreen 区分（md-fade / md-punch）
  const actualTransition = transition ?? (fullScreen ? 'md-fade' : 'md-punch')

  return (
    <div className={`md-landscape${fullScreen ? ' is-full' : ''}`} ref={ref}>
      <MdPopup
        value={isLandscapeShow}
        maskClosable={maskClosable}
        preventScroll
        preventScrollExclude=".md-landscape-content"
        hasMask={!fullScreen && hasMask}
        transition={actualTransition}
        onChange={(val) => {
          setIsLandscapeShow(val)
        }}
        onShow={onShow}
        onHide={onHide}
      >
        <div className={`md-landscape-body${scroll ? ' scroll' : ''}`}>
          <div className="md-landscape-content">{children}</div>
          <MdIcon
            className={`md-landscape-close${!hasMask || fullScreen ? ' dark' : ''}`}
            name={fullScreen ? 'clear' : 'close'}
            onClick={() => setIsLandscapeShow(false)}
          />
        </div>
      </MdPopup>
    </div>
  )
})
