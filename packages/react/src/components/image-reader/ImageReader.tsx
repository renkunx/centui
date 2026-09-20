import { forwardRef, useRef, useState, type ChangeEvent } from 'react'

export interface ImageReaderProps {
  name?: string
  /** 单张图片体积限制（KB），0 为不限制 */
  size?: string | number
  mime?: string[]
  isCameraOnly?: boolean
  isMultiple?: boolean
  /** 每次选择张数上限，0 为不限制 */
  amount?: number
  onSelect?: (name: string, data: { files: File[] }) => void
  onComplete?: (name: string, data: { blob: Blob; dataUrl: string; file: File }) => void
  onError?: (name: string, data: { code: string; msg: string }) => void
}

const ERROR: Record<string, string> = {
  '100': 'browser does not support',
  '101': 'picture size is beyond the preset',
  '102': 'picture read failure',
  '103': 'the number of pictures exceeds the limit',
}

export const CuImageReader = forwardRef<HTMLDivElement, ImageReaderProps>(function CuImageReader(
  {
    name = `image-reader-${Math.floor(Math.random() * 10000)}`,
    size = 0,
    mime = [],
    isCameraOnly = false,
    isMultiple = false,
    amount = 0,
    onSelect,
    onComplete,
    onError,
  },
  ref,
) {
  const [inputTmpKey, setInputTmpKey] = useState(() => Date.now())
  const nameRef = useRef(name)
  nameRef.current = name
  const callbacksRef = useRef({ onSelect, onComplete, onError })
  callbacksRef.current = { onSelect, onComplete, onError }

  const mimeType = mime.length
    ? mime.map(type => `image/${type}`).join(',') + ''
    : 'image/*'

  function emitter(event: 'select' | 'complete' | 'error', data: unknown) {
    const cbs = callbacksRef.current
    if (event === 'select') {
      cbs.onSelect?.(nameRef.current, data as { files: File[] })
    } else if (event === 'complete') {
      cbs.onComplete?.(nameRef.current, data as { blob: Blob; dataUrl: string; file: File })
    } else {
      cbs.onError?.(nameRef.current, data as { code: string; msg: string })
    }
  }

  function clearFile() {
    setInputTmpKey(Date.now())
  }

  function dataURItoBlob(dataURI: string): Blob {
    const arr = dataURI.split(',')
    const mime2 = arr[0].match(/:(.*?);/)?.[1] ?? 'image/png'
    const bytes = window.atob(arr[1])
    let length = bytes.length
    const u8arr = new Uint8Array(length)
    while (length--) {
      u8arr[length] = bytes.charCodeAt(length)
    }
    return new Blob([u8arr], { type: mime2 })
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const fileElement = event.target
    if (fileElement.files && fileElement.files.length) {
      emitter('select', { files: Array.prototype.slice.call(fileElement.files) })

      if (amount && fileElement.files.length > amount) {
        emitter('error', { code: '103', msg: ERROR['103'] })
        clearFile()
        return
      }

      const sizeLimit = +size * 1000
      const files = Array.prototype.slice.call(fileElement.files) as File[]
      let done = 0
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = String(reader.result ?? '')
          if (sizeLimit && dataUrl.length > sizeLimit) {
            emitter('error', { code: '101', msg: ERROR['101'] })
            done++
            if (done >= files.length) {
              clearFile()
            }
            return
          }
          const img = new Image()
          img.onload = () => {
            emitter('complete', {
              blob: dataURItoBlob(dataUrl),
              dataUrl,
              file,
            })
            done++
            if (done >= files.length) {
              clearFile()
            }
          }
          img.onerror = () => {
            emitter('error', { code: '102', msg: ERROR['102'] })
            done++
            if (done >= files.length) {
              clearFile()
            }
          }
          img.src = dataUrl
        }
        reader.onerror = () => {
          emitter('error', { code: '102', msg: ERROR['102'] })
          done++
          if (done >= files.length) {
            clearFile()
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  return (
    <div className="cu-image-reader" ref={ref}>
      <input
        key={inputTmpKey}
        className="cu-image-reader-file"
        type="file"
        name={name}
        accept={mimeType}
        {...(isCameraOnly ? ({ capture: true } as object) : {})}
        multiple={isMultiple}
        onChange={onFileChange}
      />
    </div>
  )
})
