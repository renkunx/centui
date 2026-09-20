import { forwardRef, useEffect, useRef, useState } from 'react'
import { CuSwiper, CuSwiperItem, type SwiperExposed } from '../swiper/Swiper'

export interface ImageViewerItem {
  url?: string
  alt?: string
  cls?: string
}

export interface ImageViewerProps {
  value?: boolean
  list?: Array<string | ImageViewerItem>
  initialIndex?: number
  hasDots?: boolean
  onChange?: (fromIndex: number, toIndex: number) => void
}

export const CuImageViewer = forwardRef<HTMLDivElement, ImageViewerProps>(function CuImageViewer(
  { value = false, list = [], initialIndex = 0, hasDots = true, onChange },
  ref,
) {
  const [isViewerShow, setIsViewerShow] = useState(value)
  const [imgs, setImgs] = useState<Array<ImageViewerItem>>(() =>
    list.map(item => (typeof item === 'object' ? item : { url: item })),
  )
  const [currentImgIndex, setCurrentImgIndex] = useState(() => (value ? initialIndex : 0))
  const swiperRef = useRef<SwiperExposed | null>(null)
  void swiperRef

  // v2 watch value：打开时重置位置并归一化列表
  const prevValueRef = useRef(value)
  const listRef = useRef(list)
  listRef.current = list
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      setCurrentImgIndex(initialIndex)
      setIsViewerShow(value)
      setImgs(listRef.current.map(item => (typeof item === 'object' ? item : { url: item })))
    }
  }, [value, initialIndex])

  return (
    <div
      className="cu-image-viewer"
      ref={ref}
      style={{ display: isViewerShow ? '' : 'none' }}
      onClick={() => {
        setIsViewerShow(false)
      }}
    >
      <div className="viewer-container">
        {isViewerShow ? (
          <CuSwiper
            autoplay={0}
            defaultIndex={currentImgIndex}
            hasDots={false}
            isPrevent={false}
            onAfterChange={(from, to) => {
              setCurrentImgIndex(to)
              onChange?.(from, to)
            }}
          >
            {imgs.map((item, index) => (
              <CuSwiperItem key={index} className={`viewer-item-wrap${item.cls ? ` ${item.cls}` : ''}`}>
                <div className="item">{item.url ? <img src={item.url} alt={item.alt} /> : null}</div>
              </CuSwiperItem>
            ))}
          </CuSwiper>
        ) : null}
        {hasDots ? (
          <div className="viewer-index">
            {currentImgIndex + 1}/{list.length}
          </div>
        ) : null}
      </div>
    </div>
  )
})
