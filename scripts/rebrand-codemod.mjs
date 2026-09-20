/**
 * 一次性 rebrand codemod：mand-mobile → centui
 *   - 包名：mand-mobile → centui，@mand-mobile/* → @centui/*，mand-mobile-react → @centui/react
 *   - 组件前缀：Md* → Cu*；样式前缀：md-* → cu-*
 * 范围：packages/ docs/ .changeset/ .github/ + 根配置文件。
 * 排除：legacy/（上游冻结档案）、test/（golden 采集端引用上游 npm 包）、根 README（已手写）、
 *       CHANGELOG*（上游 v2 历史记录）、dist/coverage/node_modules、pnpm-lock.yaml。
 * 保护短语（指称上游项目本身，不参与替换）：mand-mobile@2…、mand-mobile v2。
 * 保留在仓库供审计；重跑安全（替换后不再匹配原模式，幂等）。
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname

const SCOPE_DIRS = ['packages', 'docs', '.changeset', '.github']
const ROOT_FILES = ['package.json', 'vitest.config.ts', 'eslint.config.js', 'playwright.config.ts']

const EXCLUDE_DIR = new Set(['node_modules', 'dist', 'coverage', '.astro'])
const EXCLUDE_PATH = /(^|\/)(CHANGELOG\.md|CHANGELOG\.en-US\.md|CHANGELOG\.zh-CN\.md)$/
const EXT = new Set([
  '.ts', '.tsx', '.vue', '.js', '.mjs', '.cjs', '.jsx',
  '.json', '.styl', '.css', '.scss', '.md', '.mdx', '.html', '.yml', '.yaml', '.svg',
])

/** 指称上游项目本身的短语 → 占位保护，替换后还原 */
const PROTECT = [
  [/mand-mobile@2[^\s'"`)，。；]*/g, '⑨UPSTREAM_MAND⑨'],
  [/[\w./-]+\/mand-mobile(?:\/[^\s'"<>)，。；]*)?/g, '⑨UPSTREAM_URL⑨'],
  [/mand-mobile v2/g, '⑨UPSTREAM_V2⑨'],
  [/mand-mobile 续作/g, '⑨UPSTREAM_CONT⑨'],
  [/基于 mand-mobile/g, '⑨UPSTREAM_BASED⑨'],
  // 中文注释里指称上游 md- 前缀（如"上游 … 的 md-"、"源码的 md- 类名"）
  [/的 md-/g, '⑨UPSTREAM_MD_DOC⑨'],
  // golden/verify 的品牌归一代码：cu- → md- 映射目标必须是 md-（上游基线命名）
  [/\/\\bcu-\/g, 'md-'/g, '⑨CU2MD_MAP⑨'],
  [/映射回 md-/g, '⑨CU2MD_DOC⑨'],
  // extract.mjs 的源侧转换：md- → cu-（两个方向都不能被再次改写）
  [/\/\\bmd-\/g, 'cu-'/g, '⑨MD2CU_MAP⑨'],
]

const REPLACEMENTS = [
  [/mand-mobile-react/g, '@centui/react'],
  [/@mand-mobile\//g, '@centui/'],
  [/mand-mobile-repo/g, 'centui-repo'],
  [/\bmand-mobile\b/g, 'centui'],
  [/\bMd(?=[A-Z])/g, 'Cu'],
  [/\bmd-/g, 'cu-'],
]

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (EXCLUDE_DIR.has(entry.name)) continue
      yield* walk(p)
    } else if (EXT.has(extname(entry.name)) && !EXCLUDE_PATH.test(p)) {
      yield p
    }
  }
}

const files = [
  ...SCOPE_DIRS.flatMap(d => [...walk(join(ROOT, d))]),
  ...ROOT_FILES.map(f => join(ROOT, f)),
]

let changed = 0
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  let out = src
  const restore = []
  for (const [re, token] of PROTECT) {
    out = out.replace(re, m => {
      restore.push([token, m])
      return token
    })
  }
  for (const [re, to] of REPLACEMENTS) out = out.replace(re, to)
  for (const [token, original] of restore) out = out.split(token).join(original)
  if (out !== src) {
    writeFileSync(file, out)
    changed++
    console.log(`OK ${relative(ROOT, file)}`)
  }
}
console.log(`\n${changed} files updated / ${files.length} scanned`)
