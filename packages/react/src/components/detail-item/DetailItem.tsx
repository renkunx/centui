import { forwardRef, type ReactNode } from 'react'

export interface DetailItemProps {
  title?: string
  content?: string | number
  bold?: boolean
  children?: ReactNode
}

export const CuDetailItem = forwardRef<HTMLDivElement, DetailItemProps>(function CuDetailItem(
  { title = '', content = '', bold = false, children },
  ref,
) {
  return (
    <div className={`cu-detail-item${bold ? ' is-bold' : ''}`} ref={ref}>
      <div className="cu-detail-title">{title}</div>
      <div className="cu-detail-content">{children ?? content}</div>
    </div>
  )
})
