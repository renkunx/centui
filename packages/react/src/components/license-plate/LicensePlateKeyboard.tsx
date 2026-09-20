export interface LicenseKeyItem {
  value?: string | number
  type?: 'delete' | 'confirm'
  text?: string
  disabled?: boolean
}

export interface LicensePlateKeyboardProps {
  keyboard?: {
    shortcuts?: string[]
    mixedKeyboard?: LicenseKeyItem[]
    keyboardType?: number
  }
  onEnter?: (value: string | number) => void
  onDelete?: () => void
  onConfirm?: () => void
}

export function CuLicensePlateKeyboard({ keyboard = {}, onEnter, onDelete, onConfirm }: LicensePlateKeyboardProps) {
  const shortcuts = keyboard.shortcuts || []
  const keyboardType = keyboard.keyboardType || 1
  const mixedKeyboard = keyboard.mixedKeyboard || []

  if (keyboardType === 1) {
    return (
      <div className="cu-license-plate-keyboard">
        <div className="cu-shortcut-row">
          {shortcuts.map((item, index) => (
            <div key={index} className="cu-shortcut-row-item" onClick={() => onEnter?.(item)}>
              {item}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="cu-license-plate-keyboard">
      <div className="cu-mixed-key-board">
        {mixedKeyboard.map((item, index) => (
          <div key={index} className={`cu-mixed-key-board-item${item.disabled ? ' disabled' : ''}`}>
            {item.type ? (
              <div
                className={item.type}
                onClick={() => {
                  if (item.disabled) {
                    return
                  }
                  if (item.type === 'delete') {
                    onDelete?.()
                  } else {
                    onConfirm?.()
                  }
                }}
              >
                {item.type === 'confirm' && item.text ? <div>{item.text}</div> : null}
              </div>
            ) : (
              <div onClick={() => !item.disabled && onEnter?.(item.value as string | number)}>{item.value}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
