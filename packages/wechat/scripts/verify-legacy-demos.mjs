/** legacy 示例页静态校验：四件套齐全、wxml 配平、处理函数存在、usingComponents 可解析、js 可编译 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const PAGES_ROOT = join(ROOT, 'demo/pages/legacy')

let errors = 0
let warnings = 0
const fail = (m) => { console.error(`  ✗ ${m}`); errors++ }

function checkWxmlBalance(name, wxml) {
  const voidTags = new Set(['input', 'image', 'import', 'include', 'wxs'])
  const stack = []
  const re = /<(\/?)([\w-]+)([^>]*?)(\/?)>/g
  let m
  while ((m = re.exec(wxml))) {
    const [, closing, tag, attrs, selfClose] = m
    if (tag === '!--') continue
    if (closing) {
      const top = stack.pop()
      if (top !== tag) { fail(`${name}.wxml 不配平：</${tag}> 期望 </${top ?? '?'}>`); return }
    } else if (!selfClose && !voidTags.has(tag) && !attrs.endsWith('/')) {
      stack.push(tag)
    }
  }
  if (stack.length) fail(`${name}.wxml 未闭合：${stack.join('、')}`)
}

const dirs = readdirSync(PAGES_ROOT).filter((d) => d !== 'legacy.wxss' && existsSync(join(PAGES_ROOT, d, 'index.wxml'))).sort()
for (const name of dirs) {
  const dir = join(PAGES_ROOT, name)
  const wxml = readFileSync(join(dir, 'index.wxml'), 'utf8')
  const js = readFileSync(join(dir, 'index.js'), 'utf8')
  checkWxmlBalance(name, wxml)
  // 处理函数存在（bind:xxx="fn"）
  for (const m of wxml.matchAll(/(?:bind|catch)[:\w-]*="(\w+)"/g)) {
    const fn = m[1]
    if (!new RegExp(`\\b${fn}\\s*\\(`).test(js) && !new RegExp(`\\b${fn}:`).test(js)) {
      fail(`${name}: 处理函数 "${fn}" 未在 index.js 定义`)
    }
  }
  // usingComponents 可解析（path 以 /index 结尾，目标为 path + '.js'）
  const json = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
  for (const [tag, path] of Object.entries(json.usingComponents ?? {})) {
    const target = resolve(dir, path) + '.js'
    if (!existsSync(target)) fail(`${name}: ${tag} → ${path} 不存在`)
  }
  // js 可编译
  try {
    esbuild.transformSync(js, {loader: 'js', format: 'cjs'})
  } catch (e) {
    fail(`${name}.index.js 语法错误：${e.errors?.[0]?.text ?? e.message}`)
  }
}

console.log(`\nlegacy demos: ${dirs.length} 页，${errors} errors / ${warnings} warnings`)
if (errors > 0) process.exit(1)
