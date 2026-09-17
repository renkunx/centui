import { defineCollection } from 'astro:content'
import { docsSchema } from '@astrojs/starlight/schema'
import { glob } from 'astro/loaders'

/** Starlight 文档集合：双语 mdx（zh-CN 默认 + en） */
export const collections = {
  docs: defineCollection({ loader: glob({ base: './src/content/docs', pattern: '**/*.{md,mdx}' }), schema: docsSchema() }),
}