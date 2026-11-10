#!/usr/bin/env node
/**
 * 幂等生成 centui / @centui/react 的 ./es/* 子路径 exports（按需导入入口）。
 *
 * 入口清单以构建产物为准：dist 顶层存在 <name>.d.ts 的即为 vite lib 入口
 * （vite-plugin-dts 仅为入口产出 .d.ts；共享 chunk 带 hash 后缀且无 .d.ts），
 * 并校验 <name>.js / <name>.cjs 同步存在。因此运行前须先 `pnpm build`。
 *
 * 用法：pnpm build && node scripts/generate-exports.mjs [--check]
 *   --check  只校验不写入（CI 可用），有差异时退出码 1
 *
 * 包名映射：centui（packages/vue）、@centui/react（packages/react）。
 * 手工维护 exports 与 src 入口长期漂移（react 曾缺失 21 个子路径，
 * ERR_PACKAGE_PATH_NOT_EXPORTED），故由此脚本全量再生 "./es/*" 段，
 * 其余键（"." 等）保持原样。
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..'
const CHECK = process.argv.includes('--check')

const TARGETS = [
  { dir: 'packages/vue', name: 'centui' },
  { dir: 'packages/react', name: '@centui/react' },
]

for (const { dir, name } of TARGETS) {
  const pkgPath = join(ROOT, dir, 'package.json')
  const distDir = join(ROOT, dir, 'dist')
  if (!existsSync(distDir)) {
    console.error(`[skip] ${name}: dist 不存在，先运行 pnpm build`)
    continue
  }

  // 入口清单：dist 顶层 .d.ts（chunk 无 .d.ts）；并校验 js/cjs 配套
  const distFiles = new Set(readdirSync(distDir))
  const entries = [...distFiles]
    .filter(f => f.endsWith('.d.ts'))
    .map(f => f.slice(0, -'.d.ts'.length))
    .sort((a, b) => (a === 'index' ? -1 : b === 'index' ? 1 : a.localeCompare(b)))
  const broken = entries.filter(e => !distFiles.has(`${e}.js`) || !distFiles.has(`${e}.cjs`))
  if (broken.length > 0) {
    console.error(`[error] ${name}: 以下入口缺 .js/.cjs 产物，请重新构建：${broken.join(', ')}`)
    process.exit(1)
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const before = Object.keys(pkg.exports).filter(k => k.startsWith('./es/'))
  const missing = entries.filter(e => e !== 'index' && !before.includes(`./es/${e}`))
  const stale = before.filter(k => !entries.includes(k.slice('./es/'.length)))

  // 重建 exports："." 等非 es 键保持原位，./es/* 全量再生（字母序）
  const next = {}
  for (const [k, v] of Object.entries(pkg.exports)) {
    if (!k.startsWith('./es/')) next[k] = v
  }
  for (const e of entries) {
    if (e === 'index') continue // "." 即 index 入口
    next[`./es/${e}`] = {
      types: `./dist/${e}.d.ts`,
      import: `./dist/${e}.js`,
      require: `./dist/${e}.cjs`,
    }
  }

  const beforeCount = before.length
  const afterCount = entries.filter(e => e !== 'index').length
  if (beforeCount === afterCount && stale.length === 0 && missing.length === 0) {
    console.log(`[ok] ${name}: exports ./es/* ${afterCount} 条，与构建产物一致`)
  } else if (CHECK) {
    console.error(`[drift] ${name}: exports ${beforeCount} 条 ≠ 产物 ${afterCount} 条；缺失 ${missing.join(', ') || '无'}；多余 ${stale.join(', ') || '无'}`)
    process.exitCode = 1
  } else {
    pkg.exports = next
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    console.log(`[fixed] ${name}: exports ./es/* ${beforeCount} → ${afterCount} 条；新增 ${missing.join(', ') || '无'}；移除 ${stale.join(', ') || '无'}`)
  }
}
