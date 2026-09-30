import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import '@centui/styles/global.css'
import '@centui/styles'
import '../freeze.css'
import { SCENES } from './scenes'
import { SCENE_PAGES } from '../shared'

/**
 * L4 e2e 场景页（React 侧）：hash 路由 #/<page>。
 * 页面根节点带 data-scene="<page>"，供 Playwright 元素级截图。
 */
function App() {
  const [pageId, setPageId] = useState(
    location.hash.replace(/^#\/?/, '') || SCENE_PAGES[0]!.id,
  )
  useEffect(() => {
    const onHash = () => setPageId(location.hash.replace(/^#\/?/, ''))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const Scene = SCENES[pageId]
  return (
    <main className="e2e-page">
      {Scene ? (
        <section className="e2e-scene" data-scene={pageId}>
          <Scene />
        </section>
      ) : (
        <p className="e2e-state">未知场景页：{pageId}</p>
      )}
    </main>
  )
}

createRoot(document.getElementById('app')!).render(<App />)
