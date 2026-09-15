/**
 * 一次性迁移工具：从 legacy v2 SFC 抽取 <style lang="stylus"> 为独立 .styl 源文件。
 * 输出 packages/styles/src/components/<name>.styl（同名组件多文件按 index.vue 优先合并）。
 * 保留在仓库供审计与后续增量抽取（新增组件或样式修订时重跑安全，幂等覆盖）。
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, basename } from 'node:path'

const LEGACY_COMPONENTS = new URL('../../../legacy/components/', import.meta.url)
const OUT_DIR = new URL('../src/components/', import.meta.url)

const EXCLUDE = new Set(['_util', '_locale', '_style', 'check-base'])
const SKIP_SUBPATH = new Set(['demo', 'test'])

/** 资产引用重写：v2 的 ../_style/images → 包内 ../images（源文件已随迁移拷贝） */
function rewriteAssetUrl(block) {
  return block.replace(/\.\.\/+(?:components\/)?_style\/images\//g, '../images/')
}

function extractStyleBlocks(vueFile) {
  const content = readFileSync(vueFile, 'utf8')
  const blocks = []
  const re = /<style[^>]*lang=["']stylus["'][^>]*>([\s\S]*?)<\/style>/g
  let m
  while ((m = re.exec(content)) !== null) {
    blocks.push(m[1].replace(/^\n+|\n+$/g, ''))
  }
  return blocks
}

mkdirSync(OUT_DIR, { recursive: true })

const components = readdirSync(LEGACY_COMPONENTS, { withFileTypes: true })
  .filter(d => d.isDirectory() && !EXCLUDE.has(d.name))
  .map(d => d.name)
  .sort()

let total = 0
const report = []

for (const name of components) {
  const dir = join(LEGACY_COMPONENTS.pathname, name)
  const vueFiles = readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.vue'))
    .map(e => e.name)
    .filter(f => !SKIP_SUBPATH.has(f))
    // index.vue 优先，其余按字典序
    .sort((a, b) => (a === 'index.vue' ? -1 : b === 'index.vue' ? 1 : a.localeCompare(b)))

  const chunks = []
  for (const file of vueFiles) {
    const blocks = extractStyleBlocks(join(dir, file)).map(rewriteAssetUrl)
    if (blocks.length === 0) continue
    chunks.push(`/* --- ${file} --- */\n${blocks.join('\n\n')}`)
  }

  if (chunks.length === 0) {
    report.push(`SKIP ${name}（无样式块）`)
    continue
  }

  // 递归找子目录中的 .vue（如 cashier/channel.vue）
  const subDirs = readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !SKIP_SUBPATH.has(e.name))
    .map(e => e.name)
    .sort()
  for (const sub of subDirs) {
    const subFiles = readdirSync(join(dir, sub), { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith('.vue'))
      .map(e => e.name)
      .sort()
    for (const file of subFiles) {
      const blocks = extractStyleBlocks(join(dir, sub, file)).map(rewriteAssetUrl)
      if (blocks.length === 0) continue
      chunks.push(`/* --- ${sub}/${file} --- */\n${blocks.join('\n\n')}`)
    }
  }

  const out = join(OUT_DIR.pathname, `${name}.styl`)
  writeFileSync(out, `/* Extracted from legacy/components/${name} — do not edit by hand; re-run scripts/extract.mjs */\n${chunks.join('\n\n')}\n`)
  total++
  report.push(`OK   ${name} (${vueFiles.length} files)`)
}

console.log(report.join('\n'))
console.log(`\nExtracted ${total} component styles → ${existsSync(OUT_DIR) ? basename(OUT_DIR.pathname) : 'src/components'}`)
