/**
 * 样式编译流水线（对齐 v2 lib 产物语义）：
 * 1. 每个组件 .styl 经 stylus 编译（注入 theme.components/theme.basic/util 全局变量）
 * 2. postcss：autoprefixer（iOS>=8/Android>4）→ cssnano（对齐 v2 preset 微调）→ url inline
 * 3. 产物：dist/index.css（全量，纯组件样式）+ dist/es/<name>.css（按需）
 *    + dist/global.css（可选的全局 reset 与字体，v2 语义，由使用方显式引入）
 * 与 v2 差异：
 *   - index.css 不再内联 global.styl——组件库不得影响组件之外的样式，
 *     需要 v2 全局 reset 的项目自行引入 @centui/styles/global.css
 *   - px 保持原样（v2 发布产物同样不落 pxtorem，rem 转换留给用户侧 postcss）
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

  // v2 内嵌字体（DIDIFD-Medium 数字子集）
  const fontsPath = join(SRC, 'fonts.styl')
  const fontsCss = await processCss(
    await compileStylus(readFileSync(fontsPath, 'utf8'), fontsPath),
    fontsPath,
    join(DIST, 'fonts.css'),
  )
  writeFileSync(join(DIST, 'fonts.css'), fontsCss)

  // 组件作用域重置（.cu-* 子树内补齐 v2 全局 reset 的等价效果）
  const scopedResetPath = join(SRC, 'scoped-reset.styl')
  const scopedResetCss = await processCss(
    await compileStylus(readFileSync(scopedResetPath, 'utf8'), scopedResetPath),
    scopedResetPath,
    join(DIST, 'scoped-reset.css'),
  )
  writeFileSync(join(DIST, 'scoped-reset.css'), scopedResetCss)

  // 全局基础样式
  const globalPath = join(SRC, 'global.styl')
  const globalCss = await processCss(
    await compileStylus(readFileSync(globalPath, 'utf8'), globalPath),
    globalPath,
    join(DIST, 'global.css'),
  )
  writeFileSync(join(DIST, 'global.css'), globalCss)

  // 组件样式
  const files = readdirSync(join(SRC, 'components'))
    .filter(f => f.endsWith('.styl'))
    .sort()
  // index.css 为纯组件样式聚合，不含 globalCss（见文件头注释）
  const bundles = []
  let failed = 0

  for (const file of files) {
    const name = file.replace(/\.styl$/, '')
    const srcPath = join(SRC, 'components', file)
    const source = readFileSync(srcPath, 'utf8')
    try {
      const css = await processCss(await compileStylus(source, srcPath), srcPath, join(DIST, 'es', `${name}.css`))
      writeFileSync(join(DIST, 'es', `${name}.css`), css)
      bundles.push(css)
    } catch (err) {
      failed++
      console.error(`FAIL ${name}: ${err.message}`)
    }
  }

  // index.css 顶部插入字体声明 + 作用域重置（对齐 v2 主产物行为，见各文件头注释）
  writeFileSync(join(DIST, 'index.css'), fontsCss + scopedResetCss + bundles.join(''))
  console.log(`Built ${files.length - failed}/${files.length} component styles + global.css + fonts.css + scoped-reset.css + index.css`)
  if (failed > 0) {
    process.exit(1)
  }
}

main()
