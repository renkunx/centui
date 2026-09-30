import { computed, createApp, defineComponent, ref } from 'vue'
import '@centui/styles/global.css'
import '@centui/styles'
import '../freeze.css'
import * as centui from 'centui'
import { SCENES } from './scenes'
import { SCENE_PAGES } from '../shared'

/**
 * L4 e2e 场景页（Vue 3 侧）：hash 路由 #/<page>。
 * 所有 Cu* 组件全局注册，场景内联模板直接解析；
 * 页面根节点带 data-scene="<page>"，供 Playwright 元素级截图。
 */
const E2eApp = defineComponent({
  name: 'e2e-app',
  setup() {
    const pageId = ref(location.hash.replace(/^#\/?/, '') || SCENE_PAGES[0]!.id)
    window.addEventListener('hashchange', () => {
      pageId.value = location.hash.replace(/^#\/?/, '')
    })

    const scene = computed(() => SCENES[pageId.value])
    return { pageId, scene }
  },
  template: `
    <main class="e2e-page">
      <section v-if="scene" class="e2e-scene" :data-scene="pageId">
        <component :is="scene" :key="pageId" />
      </section>
      <p v-else class="e2e-state">未知场景页：{{ pageId }}</p>
    </main>
  `,
})

const app = createApp(E2eApp)

for (const [name, value] of Object.entries(centui)) {
  if (name.startsWith('Cu') && value && typeof value === 'object') {
    app.component(name, value as never)
  }
}

app.mount('#app')
