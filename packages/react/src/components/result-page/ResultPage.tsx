import { forwardRef, type MouseEvent, type ReactNode } from 'react'
import { CuButton } from '../button/Button'

export interface ResultPageButton {
  text?: string
  type?: string
  plain?: boolean
  round?: boolean
  inactive?: boolean
  loading?: boolean
  icon?: string
  iconSvg?: boolean
  handler?: (event: MouseEvent<HTMLButtonElement>) => void
}

export interface ResultPageProps {
  /** empty | network | lost 等内置类型（决定默认图与默认文案） */
  type?: string
  imgUrl?: string
  text?: string
  subtext?: string
  buttons?: ResultPageButton[]
  children?: ReactNode
}

const IMG_PRE = '//manhattan.didistatic.com/static/manhattan/mand-mobile/result-page/2.1/'

const DEFAULT_TEXT: Record<string, string> = {
  // 网络连接异常
  network: '网络连接异常',
  // 暂无信息
  empty: '暂无信息',
}

const DEFAULT_SUBTEXT: Record<string, string> = {
  // 您要访问的页面已丢失
  lost: '您要访问的页面已丢失',
}

export const CuResultPage = forwardRef<HTMLDivElement, ResultPageProps>(function CuResultPage(
  { type = 'empty', imgUrl = '', text = '', subtext = '', buttons = [], children },
  ref,
) {
  const actualImgUrl = imgUrl || `${IMG_PRE}${type}.png`
  const actualText = text || DEFAULT_TEXT[type] || ''
  const actualSubtext = subtext || DEFAULT_SUBTEXT[type] || ''

  return (
    <div className="cu-result" ref={ref}>
      <div className="cu-result-image">
        <img src={actualImgUrl} className={!imgUrl ? type : ''} />
      </div>
      {actualText ? <div className="cu-result-text">{actualText}</div> : null}
      {actualSubtext ? <div className="cu-result-subtext">{actualSubtext}</div> : null}
      {buttons.length ? (
        <div className="cu-result-buttons">
          {buttons.map((button, index) => (
            <CuButton
              key={index}
              type={button.type}
              plain={button.plain === undefined || button.plain}
              round={button.round}
              inactive={button.inactive}
              loading={button.loading}
              icon={button.icon}
              iconSvg={button.iconSvg}
              size="small"
              inline
              onClick={(event) => button.handler?.(event)}
            >
              {button.text}
            </CuButton>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  )
})
