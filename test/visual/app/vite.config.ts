import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * L4 e2e 场景页：单 vite 服务双入口
 * - /vue.html   Vue 3（centui）
 * - /react.html React（@centui/react）
 * hash 路由选择组件页：#/<page>，场景区块以 data-scene 标注供 Playwright 定位
 */
export default defineConfig({
  plugins: [vue(), react()],
  resolve: {
    alias: {
      // 场景定义使用内联 template，需要运行时编译器
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  build: {
    rollupOptions: {
      input: {
        vue: fileURLToPath(new URL('./vue.html', import.meta.url)),
        react: fileURLToPath(new URL('./react.html', import.meta.url)),
      },
    },
  },
})
