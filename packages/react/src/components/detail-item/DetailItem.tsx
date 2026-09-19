import { forwardRef, type ReactNode } from 'react'

export interface DetailItemProps {
  title?: string
  content?: string | number
  bold?: boolean
  children?: ReactNode
}

export const MdDetailItem = forwardRef<HTMLDivElement, DetailItemProps>(function MdDetailItem(
  { title = '', content = '', bold = false, children },
  ref,
) {
  return (
    <div className={`md-detail-item${bold ? ' is-bold' : ''}`} ref={ref}>
      <div className="md-detail-title">{title}</div>
      <div className="md-detail-content">{children ?? content}</div>
    </div>
  )
})
