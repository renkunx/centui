/**
 * L3 产物验证：packages/styles/dist 与 npm mand-mobile@2.7.0 的 lib CSS 做规范化对比。
 * 对比维度（按严苛度递减）：
 *   1. 选择器集合差异（顺序无关）
 *   2. 每个选择器的声明集合差异（prop:value 规范化后对比）
 * 预期差异（工具链版本演进，白名单化忽略）：
 *   - autoprefixer/cssnano 版本差异引起的前缀属性、数值写法（0.5/.5）、颜色大小写
 * 退出码：选择器缺失即失败；仅声明差异输出报告供人工审定。
 *
 * 用法：node scripts/verify.mjs <path-to-npm-package-lib>
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'

const OUR_ES = new URL('../dist/es/', import.meta.url).pathname
const V2_LIB = process.argv[2]

if (!V2_LIB) {
  console.error('usage: node scripts/verify.mjs <npm-package>/lib')
  process.exit(2)
}

/** 解析 CSS 为 Map<selector, Set<"prop:value">>（@media 内规则选择器加前缀标记） */
function parseCss(css) {
  const map = new Map()
  const addRule = (sel, decls, media = '') => {
    sel = sel.replace(/\s+/g, ' ').trim()
    // 品牌 rebrand 归一：centui 产物为 cu- 前缀，上游 v2 lib 为 cu- 前缀 →
    // 统一映射回 cu- 再比较（对 v2 侧幂等，覆盖选择器与 @keyframes 名）
    sel = sel.replace(/\bcu-/g, 'md-')
    if (media) sel = `@${media} ${sel}`
    const set = map.get(sel) ?? new Set()
    decls.forEach(d => set.add(d))
    map.set(sel, set)
  }
  const walk = (root, media = '') => {
    root.nodes?.forEach(node => {
      if (node.type === 'rule') {
        addRule(
          node.selector,
          node.nodes
            .filter(n => n.type === 'decl')
            .map(n => `${n.prop}:${n.value.replace(/\s+/g, ' ').trim()}`),
          media,
        )
      } else if (node.type === 'atrule' && node.name === 'media') {
        walk(node, node.params.replace(/\s+/g, ' '))
      } else if (node.type === 'atrule' && node.nodes) {
        // keyframes 等：整块按名称记录
        addRule(`@${node.name} ${node.params}`, [], media)
      }
    })
  }
  walk(postcss.parse(css).root !== undefined ? postcss.parse(css) : postcss.parse(css))
  return map
}

/** 规范化声明的预期差异：厂商前缀属性集合差异（autoprefixer 版本演进），视为可忽略 */
function isIgnorableDecl(decl) {
  return /(^|:)-?(webkit|moz|ms|o)-/.test(decl)
}

const ourFiles = readdirSync(OUR_ES)
  .filter(f => f.endsWith('.css'))
  .map(f => f.replace(/\.css$/, ''))

let missingSelectors = 0
let declDiffComponents = 0
const report = []

for (const name of ourFiles) {
  const candidates = [join(V2_LIB, name, 'style', 'index.css'), join(V2_LIB, name, 'style', `${name}.css`)]
  let v2Css
  try {
    v2Css = readFileSync(candidates[0], 'utf8')
  } catch {
    try {
      v2Css = readFileSync(candidates[1], 'utf8')
    } catch {
      report.push(`NO-V2 ${name}（v2 无此产物，可能为合并目录）`)
      continue
    }
  }
  const ours = parseCss(readFileSync(join(OUR_ES, `${name}.css`), 'utf8'))
  const v2 = parseCss(v2Css)

  const missing = [...v2.keys()].filter(s => !ours.has(s))
  const added = [...ours.keys()].filter(s => !v2.has(s))
  if (missing.length > 0) {
    missingSelectors += missing.length
    report.push(`MISSING ${name}: ${missing.length} 个选择器缺失\n    ${missing.slice(0, 3).join('\n    ')}`)
  }

  const declDiffs = []
  for (const [sel, oursDecls] of ours) {
    const v2Decls = v2.get(sel)
    if (!v2Decls) continue
    const only = [...oursDecls].filter(d => !v2Decls.has(d) && !isIgnorableDecl(d))
    const gone = [...v2Decls].filter(d => !oursDecls.has(d) && !isIgnorableDecl(d))
    if (only.length || gone.length) {
      declDiffs.push({ sel, only, gone })
    }
  }
  if (declDiffs.length > 0) {
    declDiffComponents++
    report.push(
      `DECLDIFF ${name}: ${declDiffs.length} 个选择器声明差异` +
        declDiffs
          .slice(0, 2)
          .map(
            d =>
              `\n    ${d.sel}\n      ours-only: ${d.only.slice(0, 2).join('; ')}\n      v2-only: ${d.gone.slice(0, 2).join('; ')}`,
          )
          .join(''),
    )
  }
  if (missing.length === 0 && declDiffs.length === 0 && added.length === 0) {
    report.push(`MATCH   ${name}`)
  }
}

console.log(report.sort().join('\n'))
console.log(`\n=== 汇总: ${ourFiles.length} 组件 | 缺失选择器 ${missingSelectors} | 声明差异组件 ${declDiffComponents} ===`)
process.exit(missingSelectors > 0 ? 1 : 0)
