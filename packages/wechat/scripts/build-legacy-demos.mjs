/**
 * legacy 示例批量移植生成器：把 legacy/components/<name>/demo/cases/*.vue 翻译为
 * demo/pages/legacy/<name>/index.{wxml,js,json,wxss}。
 *
 * 翻译策略：
 *  - 模板确定性改写：md-* → cu-*、:prop → prop="{{...}}"、@ev → bind:ev、
 *    div/span/p → view/text/view、v-model → value + bind:change="noop"、
 *    v-if/v-for 简单形态 → wx:if/wx:for；方法调用表达式等不可判定构造留 TODO
 *  - case 定义对象（export default{...}）经沙箱求值 → data（JSON 化）+ methods
 *    （fn.toString 回填源码）；求值失败留 TODO，不阻塞整页生成
 *  - case 与 demo/index.vue 的 stylus 样式编译合并进页面 wxss
 *  - 每页 @import ../legacy.wxss（框架样式）；section 标题 = case.title || '基础'
 *  - 产物清单与 TODO 写入 dist/legacy-demos-report.json；页面注册清单写 demo/pages/legacy/pages.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import stylus from 'stylus'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPO = resolve(ROOT, '../..')
const LEGACY = join(REPO, 'legacy/components')
const OUT = join(ROOT, 'demo/pages/legacy')
const INVENTORY = '/tmp/legacy-cases.json'
const EVENT_MAP = {click: 'tap'}

function renderStyl(source, filename) {
  return new Promise((res, rej) => {
    stylus(source).set('filename', filename).render((e, css) => (e ? rej(e) : res(css)))
  })
}

/** 按花括号配平截取 export default {...} 对象体 */
function extractDefaultObject(script) {
  const m = script.match(/export\s+default\s*\{/)
  if (!m) return null
  const start = m.index + m[0].length
  let depth = 1
  for (let i = start; i < script.length; i++) {
    const ch = script[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return script.slice(start, i)
    }
  }
  return null
}

/** 沙箱求值 case 定义对象（去除文档字段与组件注册） */
function evalCaseDef(src, file, todos) {
  const scriptMatch = src.match(/<script>([\s\S]*)<\/script>/)
  if (!scriptMatch) return {data: {}, methods: {}}
  let script = scriptMatch[1].replace(/^\s*import .*$/gm, '')
  const body = extractDefaultObject(script)
  if (body == null) {
    todos.push(`${file}: 无法定位 export default 对象，data/methods 未搬运`)
    return {data: {}, methods: {}}
  }
  // export default 之前的模块层声明整块进求值作用域（const 可能跨多行，按块保留）
  const exportAt = script.search(/export\s+default\s*\{/)
  const prelude = exportAt > 0 ? script.slice(0, exportAt) : ''
  const cleaned = body
    .replace(/^\s*(name|title|titleEnUS|align):\s*['"][^'"]*['"],?\s*$/gm, '')
    .replace(/components:\s*\{[\s\S]*?\},?/, '')
  try {
    // eslint-disable-next-line no-new-func
    const def = new Function(
      `${prelude}\nconst document = {querySelector: () => null, body: {}, createElement: () => ({style: {}})};\nconst window = {};\nreturn {\n${cleaned}\n}`,
    )()
    const data = typeof def.data === 'function' ? def.data() : (def.data ?? {})
    JSON.stringify(data)
    return {data, methods: def.methods ?? {}}
  } catch (e) {
    todos.push(`${file}: 定义对象求值失败（${String(e.message).slice(0, 80)}），data/methods 未搬运`)
    return {data: {}, methods: {}}
  }
}

/** Vue 模板 → wxml；返回 {out, needsNoop} */
function translateTemplate(tpl, todos) {
  let needsNoop = false
  let out = tpl
  out = out.replace(/<\/?md-([\w-]+)/g, (m) => m.replace('md-', 'cu-'))
  out = out.replace(/:([\w-]+)="'([^"]*)'"/g, (m, prop, expr) => `${prop}="{{${expr}}}"`)
  out = out.replace(/:([\w-]+)="([^"]*)"/g, (m, prop, expr) => `${prop}="{{${expr}}}"`)
  out = out.replace(/@(\w[\w-]*)="([^"]+)"/g, (m, ev, h) => `bind:${EVENT_MAP[ev] ?? ev}="${h}"`)
  needsNoop = /v-model=/.test(out)
  out = out.replace(/v-model="(\w+)"/g, 'value="{{$1}}" bind:change="noop"')
  out = out.replace(/<\/(\w+)\s+>/g, '</$1>')
  out = out.replace(/<img\b([^>]*?)\s*\/?>/g, '<image$1 />')
  out = out.replace(/<div\b/g, '<view').replace(/<\/div>/g, '</view>')
  out = out.replace(/<span\b/g, '<text').replace(/<\/span>/g, '</text>')
  out = out.replace(/<p\b/g, '<view class="legacy-p"').replace(/<\/p>/g, '</view>')
  out = out.replace(/<br\s*\/?>/g, '')
  const calls = out.match(/{{[^}]*\w+\([^}]*}}/g)
  if (calls) todos.push(`wxml 方法调用表达式需改写：${calls.slice(0, 3).join('；')}`)
  out = out.replace(/v-if="/g, 'wx:if="{{').replace(/v-show="/g, 'wx:if="{{')
  if (/v-for=/.test(out)) todos.push('v-for 需复核 wx:for/wx:key 改写')
  out = out.replace(/v-for="(\w+)\s+in\s+(\w+)"/g, 'wx:for="{{$2}}" wx:for-item="$1"')
  if (/v-else|v-html/.test(out)) todos.push('存在 v-else/v-html 需人工核对')
  return {out, needsNoop}
}

async function main() {
  const inventory = JSON.parse(readFileSync(INVENTORY, 'utf8'))
  const report = {}
  const pages = []

  for (const [name, cases] of Object.entries(inventory)) {
    const dir = join(OUT, name)
    mkdirSync(dir, {recursive: true})
    const todos = []
    const sections = []
    const styles = []
    const pageData = {}
    const pageMethods = {}
    const usedComponents = new Set()

    for (const c of cases) {
      const srcPath = join(LEGACY, name, 'demo/cases', c.file)
      const src = readFileSync(srcPath, 'utf8')
      const title = (src.match(/^\s*title:\s*'(.+?)'/m) || [])[1] ?? '基础'
      const tpl = (src.match(/<template>([\s\S]*)<\/template>/) || [])[1] ?? ''
      const {data: caseData, methods: caseMethods} = evalCaseDef(src, c.file, todos)
      Object.assign(pageData, caseData)
      Object.assign(pageMethods, caseMethods)
      const style = (src.match(/<style[^>]*>([\s\S]*?)<\/style>/) || [])[1] ?? ''
      if (style.trim()) {
        try {
          styles.push(await renderStyl(style, srcPath))
        } catch (e) {
          todos.push(`case ${c.file} 样式编译失败：${String(e.message).slice(0, 80)}`)
        }
      }
      const {out: translated} = translateTemplate(tpl, todos)
      for (const m of translated.matchAll(/<cu-([\w-]+)/g)) usedComponents.add(m[1])
      sections.push(
        `  <view class="legacy-section">\n    <view class="legacy-title">${title}</view>\n    <view class="legacy-content">\n${translated}\n    </view>\n  </view>`,
      )
    }

    // demo/index.vue 框架样式
    const demoIndexPath = join(LEGACY, name, 'demo/index.vue')
    if (existsSync(demoIndexPath)) {
      const idx = readFileSync(demoIndexPath, 'utf8')
      const s = (idx.match(/<style[^>]*>([\s\S]*?)<\/style>/) || [])[1] ?? ''
      if (s.trim()) {
        try {
          styles.push(await renderStyl(s, demoIndexPath))
        } catch (e) {
          todos.push(`demo/index.vue 样式编译失败：${String(e.message).slice(0, 80)}`)
        }
      }
    }

    // wxml（含 TODO 修整清单注释）
    const wxml =
      `<view class="legacy-wrapper md-example ${name}">\n${sections.join('\n')}\n</view>\n` +
      (todos.length ? `<!--\nTODO 修整清单（${name}）：\n${todos.map((t) => `  - ${t}`).join('\n')}\n-->\n` : '')
    writeFileSync(join(dir, 'index.wxml'), wxml)

    // js：data（JSON 化）+ methods（fn.toString 回填；简写方法自带名，避免双重命名）+ noop
    const dataJson = JSON.stringify(pageData, null, 2)
    const methodSrc = Object.entries(pageMethods)
      .map(([k, fn]) => {
        const src = fn.toString().replace(/,\s*$/, '')
        const nameRe = new RegExp(`^\\s*(?:async\\s+)?${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`)
        return nameRe.test(src) ? `  ${src},` : `  ${k}: ${src},`
      })
      .join('\n')
    writeFileSync(
      join(dir, 'index.js'),
      `/* legacy/components/${name}/demo 对译（生成器产物，TODO 见 wxml 尾注释） */\nPage({\n  data: ${dataJson},\n${methodSrc ? `${methodSrc}\n` : ''}  noop() {},\n})\n`,
    )

    // wxss
    writeFileSync(join(dir, 'index.wxss'), `@import "../legacy.wxss";\n\n${styles.join('\n')}\n`)

    // json：usingComponents
    const uc = {}
    for (const c of usedComponents) {
      if (existsSync(join(ROOT, 'dist/components', c, 'index.js'))) {
        uc[`cu-${c}`] = `../../../../dist/components/${c}/index`
      } else {
        todos.push(`组件 cu-${c} 尚未移植`)
      }
    }
    writeFileSync(join(dir, 'index.json'), `${JSON.stringify({usingComponents: uc}, null, 2)}\n`)

    report[name] = {cases: cases.length, todos}
    pages.push(`demo/pages/legacy/${name}/index`)
  }

  writeFileSync(join(OUT, 'pages.json'), `${JSON.stringify(pages, null, 2)}\n`)
  mkdirSync(join(ROOT, 'dist'), {recursive: true})
  writeFileSync(join(ROOT, 'dist/legacy-demos-report.json'), JSON.stringify(report, null, 2))
  const todoPages = Object.entries(report).filter(([, r]) => r.todos.length)
  console.log(`generated ${pages.length} pages / ${Object.values(report).reduce((a, r) => a + r.cases, 0)} cases；${todoPages.length} 页带 TODO 待修整`)
}

main()
