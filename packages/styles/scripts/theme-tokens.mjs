/**
 * 设计令牌解析（build.mjs 与 verify.mjs 共用）：
 * - 从 src/mixin/theme.basic.styl + theme.components.styl 解析 token 定义
 * - token 值分两类：字面量（#hex/px/rgba()/字体栈…）与单引用（值恰为另一个 token 名）
 * - resolve(name) 传递解析出具体值；rootBlock() 生成 :root 块（引用保持 var() 链，
 *   使覆盖 --color-primary 等基础令牌可级联派生令牌）
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** stylus 配置开关（非 CSS 令牌），不进入 :root 与 var() 化 */
const NON_CSS_TOKENS = new Set(['support-for-ie'])

/** 解析单个主题文件：返回 [{ name, value, file }]（保留文件内顺序） */
function parseThemeFile(path, file) {
  const tokens = []
  for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
    // 行注释：仅剥离前置空白后的 //（URL 中的 :// 不受影响）
    const line = rawLine.replace(/\s\/\/.*$/, '').trim()
    if (!line || line.startsWith('/') || !line.includes('=')) continue
    const m = /^([a-z][a-z0-9-]*)\s*=\s*(.+)$/.exec(line)
    if (!m) continue
    if (NON_CSS_TOKENS.has(m[1])) continue
    tokens.push({ name: m[1], value: m[2].trim(), file })
  }
  return tokens
}

export class ThemeTokens {
  constructor(srcDir) {
    // 与原 build.mjs 注入顺序一致：components 先、basic 后（后定义覆盖先定义）
    this.entries = [
      ...parseThemeFile(join(srcDir, 'mixin/theme.components.styl'), 'theme.components'),
      ...parseThemeFile(join(srcDir, 'mixin/theme.basic.styl'), 'theme.basic'),
    ]
    this.map = new Map()
    const conflicts = []
    for (const t of this.entries) {
      if (this.map.has(t.name)) conflicts.push(`${t.name}（${this.map.get(t.name).file} → ${t.file}）`)
      this.map.set(t.name, t)
    }
    if (conflicts.length > 0) {
      throw new Error(`主题令牌重复定义：${conflicts.join('；')}`)
    }
    // 引用关系校验：引用必须指向已知令牌（预声明允许前向引用）
    for (const t of this.entries) {
      const ref = this.refOf(t.value)
      if (ref !== null && !this.map.has(ref)) {
        throw new Error(`主题令牌 ${t.name} 引用了未知令牌「${ref}」（${t.file}）`)
      }
    }
  }

  /** 值恰为另一令牌名时返回该令牌名，否则 null */
  refOf(value) {
    return /^[a-z][a-z0-9-]*$/.test(value) && this.map.has(value) ? value : null
  }

  /** 传递解析为具体值（引用链 → 字面量）；环与未知令牌抛错 */
  resolve(name, seen = new Set()) {
    const t = this.map.get(name)
    if (!t) throw new Error(`未知令牌「${name}」`)
    if (seen.has(name)) throw new Error(`令牌循环引用：${[...seen, name].join(' → ')}`)
    const ref = this.refOf(t.value)
    if (ref === null) return t.value
    return this.resolve(ref, new Set(seen).add(name))
  }

  /**
   * 生成 :root 块（压缩格式）。引用型令牌保持 var(--ref) 链：
   * 覆盖基础令牌（如 --color-primary）可级联到派生令牌（如 --button-primary-fill）。
   * @param {Iterable<string>} names 要输出的令牌名
   */
  rootBlock(names) {
    const decls = [...names].map(name => {
      const t = this.map.get(name)
      if (!t) throw new Error(`:root 引用了未知令牌「${name}」`)
      const ref = this.refOf(t.value)
      return `--${name}:${ref === null ? t.value : `var(--${ref})`}`
    })
    return `:root{${decls.join(';')}}\n`
  }

  /**
   * 计算某段 CSS 所需的 :root 令牌集合：扫描 var(--x) 出现项，
   * 并对引用型令牌做传递闭包（保证链上每个环节都有定义）。
   */
  requiredTokens(css) {
    const used = new Set()
    for (const m of css.matchAll(/var\((--[a-z0-9-]+)[),]/g)) {
      used.add(m[1].slice(2))
    }
    const out = new Set()
    const add = name => {
      if (out.has(name)) return
      const t = this.map.get(name)
      if (!t) throw new Error(`CSS 引用了未知令牌「${name}」`)
      out.add(name)
      const ref = this.refOf(t.value)
      if (ref !== null) add(ref)
    }
    for (const name of used) add(name)
    return out
  }
}
