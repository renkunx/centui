import { forwardRef, type ReactNode } from 'react'
import { MdWaterMark } from '../water-mark/WaterMark'

export interface BillProps {
  title?: string
  no?: string | number
  waterMark?: string
  /** 水印插槽（作用于 WaterMark 平铺） */
  watermark?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  children?: ReactNode
}

export const MdBill = forwardRef<HTMLDivElement, BillProps>(function MdBill(
  { title = '', no = '', waterMark = '', watermark, header, footer, children },
  ref,
) {
  void ref
  return (
    <MdWaterMark
      className="md-bill"
      content={waterMark}
      renderWatermark={watermark ? () => watermark : undefined}
    >
      <header className="md-bill-header">
        {header ?? (
          <>
            {title ? <h4 className="md-bill-title">{title}</h4> : null}
            {no ? <div className="md-bill-no">NO.{no}</div> : null}
          </>
        )}
      </header>
      <div className="md-bill-neck">
        <span></span>
      </div>
      <div className="md-bill-content">
        <div className="md-bill-detail">{children}</div>
        {footer ? <footer className="md-bill-footer">{footer}</footer> : null}
      </div>
    </MdWaterMark>
  )
})
