import { CuSwiper, CuSwiperItem } from '@centui/react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['自动轮播', '手动滑动', '竖向滑动', '淡入淡出', '无指示器']
const code = `<CuSwiper autoplay={3000}>
  <CuSwiperItem>轮播 1</CuSwiperItem>
  <CuSwiperItem>轮播 2</CuSwiperItem>
  <CuSwiperItem>轮播 3</CuSwiperItem>
</CuSwiper>
<CuSwiper transition="slideY" autoplay={3000}>...</CuSwiper>
<CuSwiper transition="fade" autoplay={3000}>...</CuSwiper>`
const colors = ['#5C6B77', '#2F86F6', '#FF7A45']

function slides(prefix: string) {
  return colors.map((c, i) => (
    <CuSwiperItem key={i}>
      <div className="swiper-demo-item" style={{ background: c }}>
        {prefix} {i + 1}
      </div>
    </CuSwiperItem>
  ))
}

export default function SwiperDemo() {
  return (
    <DemoCanvasReact
      mode="stage"
      scenes={scenes}
      code={code}
    >
      {active => {
        if (active === 0) return <div className="swiper-demo-box"><CuSwiper autoplay={3000}>{slides('轮播')}</CuSwiper></div>
        if (active === 1) return <div className="swiper-demo-box"><CuSwiper autoplay={0}>{slides('拖我试试')}</CuSwiper></div>
        if (active === 2) return <div className="swiper-demo-box"><CuSwiper transition="slideY" autoplay={3000}>{slides('竖向')}</CuSwiper></div>
        if (active === 3) return <div className="swiper-demo-box"><CuSwiper transition="fade" autoplay={3000}>{slides('淡入淡出')}</CuSwiper></div>
        return <div className="swiper-demo-box"><CuSwiper autoplay={3000} hasDots={false}>{slides('无指示器')}</CuSwiper></div>
      }}
    </DemoCanvasReact>
  )
}
