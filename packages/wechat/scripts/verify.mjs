/**
 * @centui/wechat 产物静态校验（DoD 的自动化部分）：
 *  - dist/components/<name>/ 四件套齐全
 *  - index.json 合法且 component:true，usingComponents 目标存在（缺失记 warning）
 *  - index.wxml 标签配平；bind:/catch: 处理函数在 index.js 中可见
 *  - index.wxss：无未换算 px（url() 内除外）、无十六进制颜色字面量（url() 内除外）
 *  - TRANSITION_DURATIONS（shared/transition.js）与 transition.styl 的 ms 值同步
 * 用法：node scripts/verify.mjs [--only <name>,<name>]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { DEP_STYLES } from './build-styles.mjs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = resolve(HERE, '..')
const DIST = join(PKG, 'dist')
const SRC = join(PKG, 'src')

const argOnly = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null

let errors = 0
let warnings = 0
const fail = (msg) => { console.error(`  ✗ ${msg}`); errors++ }
const warn = (msg) => { console.warn(`  ⚠ ${msg}`); warnings++ }

/** wxml 标签配平（自闭合与 void 标签豁免） */
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
      if (top !== tag) { fail(`${name}.wxml 标签不配平：</${tag}> 期望 </${top ?? '?'}>`); return }
    } else if (!selfClose && !voidTags.has(tag) && !attrs.endsWith('/')) {
      stack.push(tag)
    }
  }
  if (stack.length) fail(`${name}.wxml 存在未闭合标签：${stack.join('、')}`)
}

/** wxss 检查：px 残留与颜色字面量（url() 内豁免）。
 *  颜色检查先看 stylus 源：源本身就含 hex（v2 legacy 抽取源）的组件降级为 warning，
 *  只有“源干净、产物有色”才算私写字面量（error）。 */
function stripUrls(css) {
  return css.replace(/url\([^)]*\)/g, 'url()')
}

function stylHasColors(name) {
  const re = /#[0-9a-fA-F]{3,8}\b/
  const names = [name, ...(DEP_STYLES[name] ?? [])]
  for (const n of names) {
    const src = join(resolve(PKG, '../styles/src/components'), `${n}.styl`)
    if (existsSync(src) && re.test(readFileSync(src, 'utf8').replace(/url\([^)]*\)/g, 'url()'))) {
      return true
    }
  }
  return false
}

function checkWxss(name, css) {
  const stripped = stripUrls(css)
  const px = stripped.match(/-?\d*\.?\d+px\b/g)
  if (px) fail(`${name}.wxss 存在未换算 px：${[...new Set(px)].slice(0, 5).join('、')}`)
  const colors = stripped.match(/#[0-9a-fA-F]{3,8}\b/g)
  if (colors) {
    const msg = `${name}.wxss 颜色字面量（应使用 token）：${[...new Set(colors)].slice(0, 5).join('、')}`
    if (stylHasColors(name)) warn(`${msg}（继承自 stylus 源，放行）`)
    else fail(msg)
  }
}

function checkComponent(name) {
  const distDir = join(DIST, 'components', name)
  for (const f of ['index.js', 'index.json', 'index.wxml', 'index.wxss']) {
    if (!existsSync(join(distDir, f))) fail(`${name}: 缺少 dist/${f}`)
  }
  if (!existsSync(join(distDir, 'index.json'))) return

  // json
  let json
  try {
    json = JSON.parse(readFileSync(join(distDir, 'index.json'), 'utf8'))
    if (json.component !== true) fail(`${name}.json: component !== true`)
    if (!json.styleIsolation) warn(`${name}.json: 未声明 styleIsolation`)
  } catch (e) {
    fail(`${name}.json: 非法 JSON（${e.message}）`)
    return
  }
  // usingComponents
  for (const [tag, path] of Object.entries(json.usingComponents ?? {})) {
    const target = join(distDir, path)
    if (!existsSync(`${target}.js`)) {
      warn(`${name}: usingComponents "${tag}" → "${path}" 目标不存在（尚未移植？）`)
    }
  }

  // wxml
  const wxml = readFileSync(join(distDir, 'index.wxml'), 'utf8')
  checkWxmlBalance(name, wxml)
  const js = existsSync(join(distDir, 'index.js')) ? readFileSync(join(distDir, 'index.js'), 'utf8') : ''
  const handlers = [...wxml.matchAll(/(?:bind|catch|mut-bind|capture-bind|capture-catch)[:\w-]*="(\w+)"/g)].map(m => m[1])
  for (const h of new Set(handlers)) {
    if (!js.includes(h)) fail(`${name}: wxml 处理函数 "${h}" 在 index.js 中未找到`)
  }

  // wxss
  const wxssPath = join(distDir, 'index.wxss')
  if (existsSync(wxssPath)) {
    const wxss = readFileSync(wxssPath, 'utf8')
    if (!wxss.includes('@import "../../styles/tokens.wxss"')) warn(`${name}.wxss 未引入 tokens.wxss`)
    checkWxss(name, wxss)
  }

  // 源文件头注释（DoD 第 1 条）
  const srcTs = join(SRC, 'components', name, 'index.ts')
  if (existsSync(srcTs)) {
    const head = readFileSync(srcTs, 'utf8').slice(0, 800)
    if (!head.includes('Source: packages/vue/')) warn(`${name}/index.ts 文件头缺少 "Source: packages/vue/..." 注释`)
    if (!/差异|无差异/.test(head)) warn(`${name}/index.ts 文件头缺少差异声明`)
  }
}

/** transition 时长表与 styl 同步校验 */
function checkTransitionSync() {
  const stylPath = resolve(PKG, '../styles/src/components/transition.styl')
  const jsPath = join(DIST, 'shared/transition.js')
  if (!existsSync(stylPath) || !existsSync(jsPath)) return
  const styl = readFileSync(stylPath, 'utf8')
  // 解析 cu-<name>-enter-active 后的第一个 ms（enter 时长），leave-active 同理
  const parse = (kind) => {
    const out = {}
    const re = new RegExp(`cu-([\\w-]+)-${kind}-active[\\s\\S]{0,200}?(\\d+)ms`, 'g')
    let m
    while ((m = re.exec(styl))) out[m[1]] = Number(m[2])
    return out
  }
  const enterStyl = parse('enter')
  const leaveStyl = parse('leave')
  const js = readFileSync(jsPath, 'utf8')
  for (const [name, ms] of Object.entries(enterStyl)) {
    const key = name === 'mask-fade' ? "'mask-fade'" : name
    if (!js.includes(key)) warn(`transition.styl 中的 "${name}" 未登记于 TRANSITION_DURATIONS`)
    else {
      const line = js.split('\n').find(l => l.includes(key))
      const enter = /enter:\s*(\d+)/.exec(line)?.[1]
      const leave = /leave:\s*(\d+)/.exec(line)?.[1]
      if (enter !== undefined && Number(enter) !== ms) fail(`transition "${name}" enter 时长不同步：styl=${ms}ms ts=${enter}ms`)
      if (leave !== undefined && Number(leave) !== (leaveStyl[name] ?? leave)) {
        fail(`transition "${name}" leave 时长不同步：styl=${leaveStyl[name]}ms ts=${leave}ms`)
      }
    }
  }
}

function main() {
  const srcComponents = readdirSync(join(SRC, 'components')).sort()
  const targets = argOnly ?? srcComponents
  for (const name of targets) {
    if (!srcComponents.includes(name)) { fail(`未知组件：${name}`); continue }
    console.log(`check ${name}`)
    checkComponent(name)
  }
  checkTransitionSync()
  console.log(`\nverify: ${errors} errors, ${warnings} warnings`)
  if (errors > 0) process.exit(1)
}

main()
