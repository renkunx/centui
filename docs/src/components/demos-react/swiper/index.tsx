import { MdSwiper, MdSwiperItem } from 'mand-mobile-react'
import DemoCanvasReact from '../../DemoCanvasReact'

const scenes = ['自动轮播', '手动滑动', '竖向滑动', '淡入淡出', '无指示器']
const code = `<MdSwiper autoplay={3000}>
  <MdSwiperItem>轮播 1</MdSwiperItem>
  <MdSwiperItem>轮播 2</MdSwiperItem>
  <MdSwiperItem>轮播 3</MdSwiperItem>
</MdSwiper>
<MdSwiper transition="slideY" autoplay={3000}>...</MdSwiper>
<MdSwiper transition="fade" autoplay={3000}>...</MdSwiper>`
const colors = ['#5C6B77', '#2F86F6', '#FF7A45']

function slides(prefix: string) {
  return colors.map((c, i) => (
    <MdSwiperItem key={i}>
      <div className="swiper-demo-item" style={{ background: c }}>
        {prefix} {i + 1}
      </div>
    </MdSwiperItem>
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
        if (active === 0) return <div className="swiper-demo-box"><MdSwiper autoplay={3000}>{slides('轮播')}</MdSwiper></div>
        if (active === 1) return <div className="swiper-demo-box"><MdSwiper autoplay={0}>{slides('拖我试试')}</MdSwiper></div>
        if (active === 2) return <div className="swiper-demo-box"><MdSwiper transition="slideY" autoplay={3000}>{slides('竖向')}</MdSwiper></div>
        if (active === 3) return <div className="swiper-demo-box"><MdSwiper transition="fade" autoplay={3000}>{slides('淡入淡出')}</MdSwiper></div>
        return <div className="swiper-demo-box"><MdSwiper autoplay={3000} hasDots={false}>{slides('无指示器')}</MdSwiper></div>
      }}
    </DemoCanvasReact>
  )
}
