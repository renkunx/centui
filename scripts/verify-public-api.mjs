#!/usr/bin/env node
/**
 * 公共 API 面一致性校验（零依赖，CI 门禁）：
 *
 * 1. Vue/React 每个组件目录都必须有按需入口 `<name>.ts(x)`
 * 2. 每个入口在 package.json exports 里都有 `./es/<name>`（types/import/require 三件套）
 * 3. exports 不得指向不存在的入口（防止删组件后遗留导出）
 * 4. 主入口必须 re-export 每个组件目录
 * 5. 微信小程序必须覆盖 Vue 全部组件目录，且新增目录在结构组件白名单内
 * 6. 文档站（中/英 mdx、Vue/React demo、API 表）与样式源必须覆盖每个 Vue 组件
 *
 * 用法：node scripts/verify-public-api.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const fail = msg => errors.push(msg)

const isDir = p => existsSync(p) && statSync(p).isDirectory()
const componentDirs = pkg =>
  readdirSync(join(ROOT, 'packages', pkg, 'src', 'components'))
    .filter(name => isDir(join(ROOT, 'packages', pkg, 'src', 'components', name)))
    .sort()
const entryNames = pkg =>
  readdirSync(join(ROOT, 'packages', pkg, 'src'))
    .filter(file => /\.tsx?$/.test(file) && file !== 'index.ts')
    .map(file => file.replace(/\.tsx?$/, ''))
    .sort()

/** React 的 date-picker 入口复用 components/picker/DatePicker，没有独立目录 */
const ENTRY_WITHOUT_DIR = new Set(['date-picker'])
/** 仅由父组件组合、没有独立样式源的组件 */
const NO_STYLE_SOURCE = new Set(['progress'])
/** 小程序结构性支撑组件（不属于 Vue 公共组件，但需要独立目录） */
const WECHAT_STRUCTURAL = new Set([
  'check-box',
  'check-group',
  'check-list',
  'license-plate-input',
  'license-plate-keyboard',
  'popup-title-bar',
  'radio-box',
  'radio-group',
  'swiper-item',
  'tab-pane',
])

const vueDirs = componentDirs('vue')
const reactDirs = componentDirs('react')

for (const pkg of ['vue', 'react']) {
  const dirs = pkg === 'vue' ? vueDirs : reactDirs
  const entries = entryNames(pkg)
  const pkgJson = JSON.parse(readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf8'))
  const exportsMap = pkgJson.exports ?? {}
  const exportNames = Object.keys(exportsMap)
    .filter(key => key.startsWith('./es/'))
    .map(key => key.slice('./es/'.length))
    .sort()
  const indexSource = readFileSync(join(ROOT, 'packages', pkg, 'src', 'index.ts'), 'utf8')

  // 1. 组件目录 → 按需入口
  for (const name of dirs) {
    if (!entries.includes(name)) {
      fail(`${pkg}: 组件目录 components/${name} 缺少按需入口 src/${name}.ts`)
    }
  }

  // 2. 入口 → package.json exports（三件套齐全）
  for (const name of entries) {
    const target = exportsMap[`./es/${name}`]
    if (!target) {
      fail(`${pkg}: 入口 src/${name}.ts 缺少 package.json exports["./es/${name}"]`)
      continue
    }
    for (const field of ['types', 'import', 'require']) {
      if (!target[field]) {
        fail(`${pkg}: exports["./es/${name}"] 缺少 "${field}"`)
      }
    }
  }

  // 3. exports 不得指向不存在的入口
  for (const name of exportNames) {
    if (!entries.includes(name)) {
      fail(`${pkg}: exports["./es/${name}"] 指向不存在的入口 src/${name}.ts`)
    }
  }

  // 4. 主入口必须 re-export 每个组件目录
  for (const name of dirs) {
    if (!indexSource.includes(`components/${name}`)) {
      fail(`${pkg}: 主入口 src/index.ts 未导出 components/${name}`)
    }
  }

  // React 允许入口复用其他目录
  for (const name of entries) {
    if (!dirs.includes(name) && !ENTRY_WITHOUT_DIR.has(name)) {
      fail(`${pkg}: 入口 src/${name}.ts 没有对应的组件目录（如需复用请加入 ENTRY_WITHOUT_DIR）`)
    }
  }
}

// 5. 微信小程序组件覆盖
const wechatDir = join(ROOT, 'packages', 'wechat', 'src', 'components')
const wechatDirs = readdirSync(wechatDir).filter(name => isDir(join(wechatDir, name))).sort()
for (const name of vueDirs) {
  if (!wechatDirs.includes(name)) {
    fail(`wechat: 缺少 Vue 同名组件目录 components/${name}`)
  }
}
for (const name of wechatDirs) {
  if (!vueDirs.includes(name) && !WECHAT_STRUCTURAL.has(name)) {
    fail(`wechat: 组件 components/${name} 无同名 Vue 组件，且不在结构性支撑白名单内`)
  }
  for (const file of ['index.ts', 'index.json', 'index.wxml']) {
    if (!existsSync(join(wechatDir, name, file))) {
      fail(`wechat: components/${name} 缺少四件套文件 ${file}`)
    }
  }
}

// 6. 文档 / 样式覆盖
for (const name of vueDirs) {
  const checks = [
    [`docs: 缺少中文文档 docs/src/content/docs/components/${name}.mdx`, `docs/src/content/docs/components/${name}.mdx`],
    [`docs: 缺少英文文档 docs/src/content/docs/en/components/${name}.mdx`, `docs/src/content/docs/en/components/${name}.mdx`],
    [`docs: 缺少 Vue 示例 docs/src/components/demos/${name}/index.vue`, `docs/src/components/demos/${name}/index.vue`],
    [`docs: 缺少 React 示例 docs/src/components/demos-react/${name}/index.tsx`, `docs/src/components/demos-react/${name}/index.tsx`],
    [`docs: 缺少 API 表 docs/src/data/api/${name}.json`, `docs/src/data/api/${name}.json`],
  ]
  for (const [message, path] of checks) {
    if (!existsSync(join(ROOT, path))) fail(message)
  }
  if (!NO_STYLE_SOURCE.has(name) && !existsSync(join(ROOT, `packages/styles/src/components/${name}.styl`))) {
    fail(`styles: 缺少样式源 packages/styles/src/components/${name}.styl`)
  }
}

if (errors.length > 0) {
  console.error(`公共 API 面校验失败（${errors.length} 项）：`)
  for (const message of errors) console.error(`  ✗ ${message}`)
  process.exit(1)
}

console.log(
  `公共 API 面校验通过：Vue ${vueDirs.length} 组件 / React ${reactDirs.length} 目录 / ` +
    `微信 ${wechatDirs.length} 组件 / 文档与样式全覆盖`,
)
