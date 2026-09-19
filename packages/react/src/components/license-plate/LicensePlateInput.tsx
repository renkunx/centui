export interface LicensePlateInputProps {
  keyArray?: string[]
  selectedIndex?: number
  onKeyMapping?: (index: number) => void
}

export function MdLicensePlateInput({ keyArray = [], selectedIndex = 0, onKeyMapping }: LicensePlateInputProps) {
  return (
    <div className="md-license-plate-input">
      {keyArray.map((item, index) => (
        <div
          key={index}
          className={`md-license-plate-input-item${selectedIndex === index ? ' active' : ''}${
            selectedIndex === index && !item ? ' animation' : ''
          }`}
          onClick={() => onKeyMapping?.(index)}
        >
          {/* 非新能源键位 */}
          {index !== keyArray.length - 1 ? (
            <div className="md-license-plate-input-item_content">{item}</div>
          ) : (
            /* 新能源键位 */
            <div className="md-license-plate-input-item_content">
              {item && item !== ' ' ? <div>{item}</div> : <div className="emptyValue"></div>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
