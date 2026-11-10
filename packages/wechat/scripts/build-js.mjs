/**
 * @centui/wechat JS 构建：
 * 1. 每个组件 src/components/<name>/index.ts → dist/components/<name>/index.js
 *    （esbuild bundle:CJS，target es2018；@centui/core 打入公共 common/core.js —— DOM-free 主入口）
 * 2. shared/*.ts → dist/shared/*.js
 * 3. icon-map：构建期求值 packages/vue/src/components/icon/default-svg-list.ts
 *    → dist/shared/icon-map.js（name → svg data-URI，供 icon 组件 mask-image 渲染）
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'
import vm from 'node:vm'
import Module from 'node:module'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = resolve(HERE, '..')
const SRC = join(PKG, 'src')
const DIST = join(PKG, 'dist')
const CORE_CJS = resolve(PKG, '../core/dist/index.cjs')
const DEFAULT_SVG_LIST = resolve(PKG, '../vue/src/components/icon/default-svg-list.ts')

const svgToDataUri = (svg) =>
  `data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22')}`

/** 构建期求值 default-svg-list.ts（export default {name: svg字符串}）→ {name: data-URI} */
export function generateIconMap() {
  const { code } = esbuild.transformSync(readFileSync(DEFAULT_SVG_LIST, 'utf8'), {
    loader: 'ts',
    format: 'cjs',
  })
  const sandbox = {
    module: { exports: {} },
    exports: {},
    require: Module.createRequire(DEFAULT_SVG_LIST),
    console,
  }
  vm.createContext(sandbox)
  vm.runInContext(code, sandbox, { filename: DEFAULT_SVG_LIST })
  const list = sandbox.module.exports.default ?? sandbox.module.exports
  if (!list || typeof list !== 'object') {
    throw new Error(`default-svg-list.ts 求值失败：${Object.keys(sandbox.module.exports)}`)
  }
  const map = {}
  for (const [name, svg] of Object.entries(list)) {
    map[name] = svgToDataUri(String(svg))
  }
  return map
}

const iconMapPlugin = {
  name: 'icon-map',
  setup(build) {
    build.onResolve({ filter: /shared\/icon-map$/ }, () => ({
      path: 'icon-map-virtual',
      namespace: 'icon-map',
    }))
    build.onLoad({ filter: /.*/, namespace: 'icon-map' }, () => ({
      contents: `module.exports.ICON_MAP = ${JSON.stringify(generateIconMap())}`,
      loader: 'js',
    }))
  },
}

const corePlugin = {
  name: 'core',
  setup(build) {
    build.onResolve({ filter: /^@centui\/core$/ }, () => ({ path: 'core-virtual', namespace: 'core' }))
    build.onLoad({ filter: /.*/, namespace: 'core' }, () => ({
      contents: readFileSync(CORE_CJS, 'utf8'),
      loader: 'js',
      // core dist 为分 chunk 产物（共享 chunk 以相对路径引用），需指明真实目录供解析
      resolveDir: dirname(CORE_CJS),
    }))
  },
}

async function bundle(entryPoint, outFile) {
  await esbuild.build({
    entryPoints: [entryPoint],
    outfile: outFile,
    bundle: true,
    format: 'cjs',
    target: ['es2018'],
    platform: 'neutral',
    mainFields: ['module', 'main'],
    plugins: [iconMapPlugin, corePlugin],
    logLevel: 'silent',
  })
}

export async function buildJs() {
  rmSync(join(DIST, 'components'), { recursive: true, force: true })
  rmSync(join(DIST, 'shared'), { recursive: true, force: true })
  mkdirSync(join(DIST, 'common'), { recursive: true })

  // 组件清单以 src 目录为准
  const components = readdirSync(join(SRC, 'components')).sort()
  let ok = 0
  for (const name of components) {
    const entry = join(SRC, 'components', name, 'index.ts')
    const json = join(SRC, 'components', name, 'index.json')
    const wxml = join(SRC, 'components', name, 'index.wxml')
    try {
      await bundle(entry, join(DIST, 'components', name, 'index.js'))
      // json/wxml 原样拷贝
      writeFileSync(join(DIST, 'components', name, 'index.json'), readFileSync(json))
      writeFileSync(join(DIST, 'components', name, 'index.wxml'), readFileSync(wxml))
      ok++
    } catch (err) {
      console.error(`FAIL js/${name}: ${err.message}`)
      process.exitCode = 1
    }
  }

  // shared 工具单独产出（供直接引用与调试；组件 bundle 内已内联同名模块；.d.ts 仅为类型声明）
  for (const f of readdirSync(join(SRC, 'shared')).filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'))) {
    await bundle(join(SRC, 'shared', f), join(DIST, 'shared', f.replace(/\.ts$/, '.js')))
  }
  console.log(`js: ${ok}/${components.length} 组件 + shared`)
}
