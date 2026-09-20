import type { ReactNode } from 'react'

export interface SkeletonProps {
  loading?: boolean
  avatar?: boolean
  row?: number
  title?: boolean
  titleWidth?: number | string
  rowWidth?: number | string | Array<number | string>
  avatarSize?: string
  children?: ReactNode
}

const DEFAULT_TITLE_WIDTH = '40%'
const DEFAULT_WIDTH = '100%'

function isNumber(n: unknown): n is number {
  return typeof n === 'number'
}

export function CuSkeleton({
  loading = true,
  avatar = false,
  row = 3,
  title = false,
  titleWidth = DEFAULT_TITLE_WIDTH,
  rowWidth = DEFAULT_WIDTH,
  avatarSize = 'md',
  children,
}: SkeletonProps) {
  const rowWidthStyle = (index: number): string => {
    if (Array.isArray(rowWidth)) {
      if (rowWidth[index] == null) {
        return DEFAULT_WIDTH
      }
      return isNumber(rowWidth[index]) ? `${rowWidth[index]}%` : String(rowWidth[index])
    }
    if (rowWidth) {
      return isNumber(rowWidth) ? `${rowWidth}%` : String(rowWidth)
    }
    return DEFAULT_WIDTH
  }

  const titleWidthStyle = isNumber(titleWidth) ? `${titleWidth}%` : String(titleWidth)

  if (!loading) {
    return <div>{children}</div>
  }

  return (
    <div className="cu-skeleton">
      {avatar ? (
        <div
          className={[
            'cu-skeleton-avatar',
            avatarSize === 'lg' ? 'cu-skeleton-avatar-large' : '',
            avatarSize === 'sm' ? 'cu-skeleton-avatar-small' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        ></div>
      ) : null}
      <div className="cu-skeleton-content">
        {title ? <h4 className="cu-skeleton-title" style={{ width: titleWidthStyle }} /> : null}
        {Array.from({ length: row }, (_, i) => i + 1).map(index => (
          <div
            key={index}
            className="cu-skeleton-row"
            style={{
              width: index === row ? '60%' : rowWidthStyle(index - 1),
            }}
          ></div>
        ))}
      </div>
    </div>
  )
}
