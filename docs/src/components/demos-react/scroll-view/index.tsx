import { useRef, useState } from 'react'
import { CuScrollView, CuScrollViewRefresh, CuScrollViewMore } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['下拉刷新 + 加载更多', '横向滚动']
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
    <DemoCanvasReact mode="stage" scenes={scenes} code={code}>
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
        return (
          <div className="scroll-demo-box--short">
          <CuScrollView scrollingY={false} autoReflow>
            <div className="scroll-demo-horizon">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="scroll-demo-card">{i + 1}</div>
              ))}
            </div>
          </CuScrollView>
          </div>
        )
      }}
    </DemoCanvasReact>
  )
}
