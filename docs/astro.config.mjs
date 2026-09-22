import { fileURLToPath } from 'node:url'
import react from '@astrojs/react'
import vue from '@astrojs/vue'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

/**
 * M5 文档站：Astro + Starlight 双语（zh-CN / en）。
 * - Vue 组件岛：组件预览（PhoneFrame + demo）client 水合
 * - centui 走源码（packages/vue/src），dev 即改即见
 * - 组件内容页（mdx）与 API 表由 scripts/gen.mjs 从 registry 生成
 */
export default defineConfig({
  // GitHub Pages 项目页：CI 注入 DOCS_SITE/DOCS_BASE（deploy-docs.yml），
  // 跟随仓库名；本地 dev/build 未注入时按 origin + '/' 处理
  site: process.env.DOCS_SITE ?? 'https://renkunx.github.io',
  base: process.env.DOCS_BASE ?? '/',
  integrations: [
    vue(),
    react(),
    starlight({
      title: 'centui',
      description: 'centui 3.0 —— 多端移动 UI 组件库（mand-mobile 续作）',
      favicon: '/favicon.png',
      // 根语言放在 root（URL 无前缀），英文走 /en/：
      // 否则 Starlight 自动生成的 Astro i18n 配置会要求默认语言带 /zh-CN/ 前缀，
      // 导致 dev 模式下根路径页面被 i18n 路由器判定 notFound 而返回 404
      defaultLocale: 'root',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
        en: { label: 'English', lang: 'en' },
      },
      sidebar: [
        {
          label: '开始',
          translations: { en: 'Getting Started' },
          items: [{ autogenerate: { directory: 'start' } }],
        },
        {
          label: '组件',
          translations: { en: 'Components' },
          items: [{ autogenerate: { directory: 'components' } }],
        },
      ],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/renkunx/centui' }],
      customCss: ['./src/styles/global.css'],
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // vue 走构建产物：dev 下 vue/react 双插件管线会把 RefreshSig 注入 .vue
        // 编译产物且页面无 preamble 导致 500；产物为纯 js 无需任何转换
        // （改 Vue 组件后 pnpm --filter @centui/core run build 不必要，仅需 styles/vue 重建）
        'centui': fileURLToPath(new URL('../packages/vue/dist/index.js', import.meta.url)),
        // react demo 走源码：dev 即改即见
        '@centui/react': fileURLToPath(new URL('../packages/react/src', import.meta.url)),
      },
    },
  },
})