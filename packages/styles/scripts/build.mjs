/**
 * 样式编译流水线（对齐 v2 lib 产物语义）：
 * 1. 每个组件 .styl 经 stylus 编译（注入 theme.components/theme.basic/util 全局变量）
 * 2. postcss：autoprefixer（iOS>=8/Android>4）→ cssnano（对齐 v2 preset 微调）→ url inline
 * 3. 产物：dist/index.css（全量，含 global.styl）+ dist/es/<name>.css（按需）
 * 与 v2 差异：px 保持原样（v2 发布产物同样不落 pxtorem，rem 转换留给用户侧 postcss）
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import stylus from 'stylus'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import cssnanoPlugin from 'cssnano'
import url from 'postcss-url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const BROWSERS = ['iOS >= 8', 'Android > 4']

const MIXIN_IMPORTS = [
  join(SRC, 'mixin/theme.components.styl'),
  join(SRC, 'mixin/theme.basic.styl'),
  join(SRC, 'mixin/util.styl'),
]

function compileStylus(source, filename) {
  return new Promise((resolve, reject) => {
    const style = stylus(source)
      .set('filename', filename)
      .set('paths', [join(SRC, 'mixin')])
    for (const imp of MIXIN_IMPORTS) {
      style.import(imp)
    }
    style.render((err, css) => (err ? reject(err) : resolve(css)))
  })
}

async function processCss(css, fromPath, toPath) {
  const result = await postcss([
    autoprefixer({ overrideBrowserslist: BROWSERS }),
    url({ url: 'inline' }),
    cssnanoPlugin({
      preset: [
        'default',
        {
          zindex: false,
          mergeIdents: false,
          discardUnused: false,
          autoprefixer: false,
          reduceIdents: false,
        },
      ],
    }),
  ]).process(css, { from: fromPath, to: toPath })
  return result.css
}

async function main() {
  mkdirSync(join(DIST, 'es'), { recursive: true })

  // 全局基础样式
  const globalCss = await processCss(
    await compileStylus(readFileSync(join(SRC, 'global.styl'), 'utf8'), 'global.styl'),
    join(SRC, 'global.styl'),
    join(DIST, 'global.css'),
  )
  writeFileSync(join(DIST, 'global.css'), globalCss)

  // 组件样式
  const files = readdirSync(join(SRC, 'components'))
    .filter(f => f.endsWith('.styl'))
    .sort()
  const bundles = [globalCss]
  let failed = 0

  for (const file of files) {
    const name = file.replace(/\.styl$/, '')
    const source = readFileSync(join(SRC, 'components', file), 'utf8')
    try {
      const css = await processCss(await compileStylus(source, file), join(SRC, 'components', file), join(DIST, 'es', `${name}.css`))
      writeFileSync(join(DIST, 'es', `${name}.css`), css)
      bundles.push(css)
    } catch (err) {
      failed++
      console.error(`FAIL ${name}: ${err.message}`)
    }
  }

  writeFileSync(join(DIST, 'index.css'), bundles.join(''))
  console.log(`Built ${files.length - failed}/${files.length} component styles + global.css + index.css`)
  if (failed > 0) {
    process.exit(1)
  }
}

main()
