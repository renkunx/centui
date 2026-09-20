import { forwardRef, type ReactNode } from 'react'
import { CuWaterMark } from '../water-mark/WaterMark'

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

export const CuBill = forwardRef<HTMLDivElement, BillProps>(function CuBill(
  { title = '', no = '', waterMark = '', watermark, header, footer, children },
  ref,
) {
  void ref
  return (
    <CuWaterMark
      className="cu-bill"
      content={waterMark}
      renderWatermark={watermark ? () => watermark : undefined}
    >
      <header className="cu-bill-header">
        {header ?? (
          <>
            {title ? <h4 className="cu-bill-title">{title}</h4> : null}
            {no ? <div className="cu-bill-no">NO.{no}</div> : null}
          </>
        )}
      </header>
      <div className="cu-bill-neck">
        <span></span>
      </div>
      <div className="cu-bill-content">
        <div className="cu-bill-detail">{children}</div>
        {footer ? <footer className="cu-bill-footer">{footer}</footer> : null}
      </div>
    </CuWaterMark>
  )
})
