import { type ReactNode } from 'react'
import { CuPopup } from '../popup/Popup'
import { inArray, t } from '@centui/core'

export interface ActionSheetOption {
  text?: string
  label?: string
  disabled?: boolean
}

export interface ActionSheetProps {
  value?: boolean
  title?: string
  options?: ActionSheetOption[]
  defaultIndex?: number
  invalidIndex?: number | number[]
  cancelText?: string
  maxHeight?: number
  onShow?: () => void
  onHide?: () => void
  onSelected?: (option: ActionSheetOption) => void
  onCancel?: () => void
  onChange?: (value: boolean) => void
  children?: ReactNode
}

export function CuActionSheet({
  value = false,
  title = '',
  options = [],
  defaultIndex = -1,
  invalidIndex = -1,
  cancelText,
  maxHeight = 400,
  onShow,
  onHide,
  onSelected,
  onCancel,
  onChange,
}: ActionSheetProps) {
  const resolvedCancelText = cancelText ?? t('md.action_sheet.cancel')
  void maxHeight

  const hideSheet = () => {
    onChange?.(false)
  }

  const onSelect = (item: ActionSheetOption, index: number) => {
    if (index === invalidIndex || inArray(invalidIndex, index)) {
      return
    }
    onSelected?.(item)
    hideSheet()
  }

  const onCancelClick = () => {
    onCancel?.()
    hideSheet()
  }

  return (
    <div className="cu-action-sheet">
      <CuPopup
        className="inner-popup large-radius"
        value={value}
        position="bottom"
        preventScroll
        onChange={val => {
          if (!val) {
            hideSheet()
          }
        }}
        onShow={onShow}
        onHide={onHide}
        onMaskClick={onCancelClick}
      >
        <div className="cu-action-sheet-content">
          {title ? <header className="cu-action-sheet-header">{title}</header> : null}
          <ul className="cu-action-sheet-list">
            {options.map((item, index) => (
              <li
                key={index}
                className={[
                  'cu-action-sheet-item',
                  index === defaultIndex ? 'active' : '',
                  index === invalidIndex || inArray(invalidIndex, index) ? 'disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(item, index)}
              >
                <div className="cu-action-sheet-item-wrapper">
                  <div
                    className="cu-action-sheet-item-section"
                    dangerouslySetInnerHTML={{ __html: item.text || item.label || '' }}
                  ></div>
                </div>
              </li>
            ))}
            <li className="cu-action-sheet-cancel" onClick={onCancelClick}>
              {resolvedCancelText}
            </li>
          </ul>
        </div>
      </CuPopup>
    </div>
  )
}
