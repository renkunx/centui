import { forwardRef, useEffect, useRef, useState } from 'react'
import { CuPopup } from '../popup/Popup'
import { CuPopupTitleBar } from '../popup/PopupTitleBar'
import { CuLicensePlateInput } from './LicensePlateInput'
import { CuLicensePlateKeyboard, type LicenseKeyItem } from './LicensePlateKeyboard'

export interface LicensePlateProps {
  shortcuts?: string[]
  modeShow?: 'division' | 'popUp'
  showPopUp?: boolean
  title?: string
  subtitle?: string
  defaultValue?: string
  disorderClick?: boolean
  onConfirm?: (value: string) => void
  onHide?: () => void
}

const DEFAULT_SHORTCUTS = [
  '京', '津', '渝', '沪', '冀', '晋', '辽', '吉', '黑', '苏',
  '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '琼',
  '川', '贵', '云', '陕', '甘', '青', '蒙', '桂', '宁', '新', '藏',
]

const LETTER_DATA: LicenseKeyItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => ({
  value: letter,
  disabled: letter === 'I' || letter === 'O',
}))

const NUMBERS: LicenseKeyItem[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(value => ({
  value,
  disabled: false,
}))

export const CuLicensePlate = forwardRef<HTMLDivElement, LicensePlateProps>(function CuLicensePlate(
  {
    shortcuts = DEFAULT_SHORTCUTS,
    modeShow = 'division',
    showPopUp = false,
    title = '请输入车牌号码',
    subtitle = '',
    defaultValue = '',
    disorderClick = true,
    onConfirm,
    onHide,
  },
  ref,
) {
  const [keyArray, setKeyArray] = useState<string[]>(['', '', '', '', '', '', '', ''])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showDivisionKeyboard, setShowDivisionKeyboard] = useState(false)

  // v2 watch defaultValue immediate
  const prevDefaultRef = useRef(defaultValue)
  useEffect(() => {
    if (prevDefaultRef.current !== defaultValue) {
      prevDefaultRef.current = defaultValue
    }
    if (defaultValue !== '') {
      const defaultValueArray = defaultValue.split('')
      setKeyArray(prev => {
        const copy = prev.slice()
        copy.forEach((_, index) => {
          copy[index] = defaultValueArray[index] ?? ''
        })
        return copy
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dyKeyboard = (() => {
    if (selectedIndex === 0) {
      return { shortcuts, mixedKeyboard: [] as LicenseKeyItem[], keyboardType: 1 }
    }
    const letters = JSON.parse(JSON.stringify(LETTER_DATA)) as LicenseKeyItem[]
    letters.splice(19, 0, { type: 'delete', disabled: false })
    letters.push({ type: 'confirm', text: '确定', disabled: false })
    let numbers = NUMBERS
    if (selectedIndex === 1) {
      numbers = NUMBERS.map(item => ({ value: item.value, disabled: true }))
    }
    return {
      shortcuts,
      mixedKeyboard: numbers.concat(letters),
      keyboardType: 2,
    }
  })()

  function keyMapping(index: number) {
    if (!showDivisionKeyboard) {
      setShowDivisionKeyboard(true)
    }
    if (!disorderClick && !keyArray[index + 1] && !keyArray[index - 1] && index > 0) {
      return
    }
    setSelectedIndex(index)
  }

  function onEnter(value: string | number) {
    setKeyArray(prev => {
      const next = prev.slice()
      next[selectedIndex] = String(value)
      return next
    })

    if (selectedIndex === keyArray.length - 1) {
      onConfirm?.(keyArray.map(item => (item ? item : ' ')).join(''))
    } else {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  function onDelete() {
    setKeyArray(prev => {
      const next = prev.slice()
      next[selectedIndex] = ''
      return next
    })

    if (selectedIndex <= 0) {
      if (modeShow === 'division') {
        setShowDivisionKeyboard(false)
      }
    } else {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  function onConfirmClick() {
    if (modeShow === 'division') {
      setShowDivisionKeyboard(false)
    }
    onConfirm?.(keyArray.map(item => (item ? item : ' ')).join(''))
  }

  return (
    <div className="cu-license-plate" ref={ref}>
      {modeShow === 'division' ? (
        <div>
          <div className="cu-license-plate-input-container division">
            <CuLicensePlateInput keyArray={keyArray} selectedIndex={selectedIndex} onKeyMapping={keyMapping} />
          </div>
          {showDivisionKeyboard ? (
            <div className="cu-license-plate-keyboard-container division">
              <CuLicensePlateKeyboard
                keyboard={dyKeyboard}
                onEnter={onEnter}
                onDelete={onDelete}
                onConfirm={onConfirmClick}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {modeShow === 'popUp' ? (
        <div>
          <CuPopup value={showPopUp} hasMask position="bottom" maskClosable={false}>
            <CuPopupTitleBar
              onlyClose
              largeRadius
              title={title}
              describe={subtitle}
              titleAlign="left"
              onCancel={() => onHide?.()}
            />
            <div className="cu-popup-content">
              <div className="cu-license-plate-input-container popUp">
                <CuLicensePlateInput keyArray={keyArray} selectedIndex={selectedIndex} onKeyMapping={keyMapping} />
              </div>
              <div className="cu-license-plate-keyboard-container popUp">
                <CuLicensePlateKeyboard
                  keyboard={dyKeyboard}
                  onEnter={onEnter}
                  onDelete={onDelete}
                  onConfirm={onConfirmClick}
                />
              </div>
            </div>
          </CuPopup>
        </div>
      ) : null}
    </div>
  )
})
