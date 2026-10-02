import { useRef, useState } from 'react'
import { CuScrollView, CuScrollViewRefresh, CuScrollViewMore, CuButton } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['下拉刷新 + 加载更多', '横向滚动', '手动初始化', '加载更多（触底）']
const code = `<CuScrollView
  ref={scrollView}
  autoReflow
  onEndReached={loadMore}
  onRefreshing={refresh}
  refresh={({ scrollTop }) => <CuScrollViewRefresh scrollTop={scrollTop} />}
  more={({ isEndReaching }) => <CuScrollViewMore isFinished={isEndReaching} />}
>
  {items.map(i => <div key={i} className="scroll-demo-item">{i}</div>)}
</CuScrollView>`

export default function ScrollViewDemo() {
  const scrollView = useRef<{ finishRefresh: () => void; finishLoadMore: () => void }>(null)
  const [items, setItems] = useState<number[]>(() => Array.from({ length: 15 }, (_, i) => i + 1))
  const [isFinished, setIsFinished] = useState(false)
  const [endItems, setEndItems] = useState<number[]>(() => Array.from({ length: 10 }, (_, i) => i + 1))
  const [endFinished, setEndFinished] = useState(false)
  const endFinishedRef = useRef(endFinished)
  endFinishedRef.current = endFinished
  const manualView = useRef<{ init: () => void } | null>(null)

  const refresh = () => {
    setTimeout(() => {
      setItems(Array.from({ length: 15 }, (_, i) => i + 1))
      setIsFinished(false)
      scrollView.current?.finishRefresh()
    }, 1200)
  }

  const loadMore = () => {
    if (isFinished) {
      return
    }
    setTimeout(() => {
      setItems(prev => {
        const next = prev.length + 5
        if (next > 40) {
          setIsFinished(true)
          return prev
        }
        return Array.from({ length: next }, (_, i) => i + 1)
      })
      scrollView.current?.finishLoadMore()
    }, 1000)
  }

  return (
    <DemoCanvasReact scenes={scenes} code={code}>
      {active => {
        if (active === 0)
          return (
            <div className="scroll-demo-box">
            <CuScrollView
              ref={scrollView as never}
              autoReflow
              onEndReached={loadMore}
              onRefreshing={refresh}
              refresh={({ scrollTop }) => <CuScrollViewRefresh scrollTop={scrollTop} />}
              more={({ isEndReaching }) => <CuScrollViewMore isFinished={isEndReaching} />}
            >
              {items.map(i => (
                <div key={i} className="scroll-demo-item">{i}</div>
              ))}
            </CuScrollView>
            </div>
          )
        if (active === 2)
          return (
            <div className="scroll-pad">
              <CuButton size="small" inline onClick={() => manualView.current?.init()}>
                手动初始化滚动区域
              </CuButton>
              <div className="scroll-demo-box--manual">
                <CuScrollView ref={manualView as never} manualInit>
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} className="scroll-demo-item">{i + 1}</div>
                  ))}
                </CuScrollView>
              </div>
            </div>
          )
        return (
          <div className="scroll-demo-box">
            <CuScrollView
              immediateCheckEndReaching
              endReachedThreshold={60}
              onEndReached={() => {
                if (endFinishedRef.current) {
                  return
                }
                setTimeout(() => {
                  setEndItems(prev => {
                    const next = prev.length + 5
                    if (next > 30) {
                      setEndFinished(true)
                      return prev
                    }
                    return Array.from({ length: next }, (_, i) => i + 1)
                  })
                }, 800)
              }}
            >
              {endItems.map(i => (
                <div key={i} className="scroll-demo-item">{i}</div>
              ))}
            </CuScrollView>
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
