/**
 * @centui/wechat 样式构建：
 * 1. 复用 packages/styles 的 ThemeTokens + stylus 注入（theme.css-vars/util），与主包产物同一套 token 体系
 * 2. 组件 .styl 编译 → postcss → px→rpx 恒等换算（token 体系为 750px 设计稿，rpx 为 750 屏宽，1px=1rpx；
 *    url() 内的 svg data-URI 不换算）
 * 3. 产物：dist/styles/tokens.wxss（page 级 CSS 变量默认值，小程序无 :root）+ dist/styles/global.wxss
 *    （scoped-reset + 平台 shim）+ dist/components/<name>/index.wxss（头部 @import tokens）
 * 4. DEP_STYLES：组件样式依赖的其他组件 styl（如 popup 依赖 transition 家族类）一并编入该组件 wxss
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import stylus from 'stylus'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import cssnanoPlugin from 'cssnano'
import { ThemeTokens } from '../../styles/scripts/theme-tokens.mjs'
import { scanLeaks } from '../../styles/scripts/scan-leaks.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = resolve(HERE, '..')
const STYLES_SRC = resolve(PKG, '../styles/src')
const DIST = join(PKG, 'dist')
// 与主包 packages/styles 构建同靶向：更老基线触发 autoprefixer 的渐变角度改写等
// 规范化转换，保证产物与主包一致（也为泄漏扫描去除 `to right` 裸标识符）
const BROWSERS = ['iOS >= 8', 'Android > 4']

/** 组件对其他组件 styl 的依赖（类选择器被本组件 wxml 引用） */
export const DEP_STYLES = {
  popup: ['transition'],
  dialog: ['transition'],
  'action-sheet': ['transition'],
  'number-keyboard': ['transition'],
  captcha: ['transition'],
  'date-picker': ['transition'],
  selector: ['transition', 'cell-item', 'radio', 'check'],
  // input-item / textarea-item 自绘 field-item 结构（.cu-field-item-* 与
  // .cu-input-item 的后代规则须同树生效）
  'field-item': ['field'], // field-item.styl 源内 @import 'field'
  'input-item': ['field'],
  'textarea-item': ['field'],
  // drop-menu 自绘 radio-list 结构（.cu-drop-menu-list .cu-radio-item 后代规则）
  'drop-menu': ['cell-item', 'radio'],
  // 批次 D（滚动类）：tab 系自绘 tab-bar/选项列表；swiper-item 的 .cu-swiper-item 规则在 swiper.styl
  'tab-picker': ['transition', 'tab-bar', 'tabs', 'cell-item', 'radio'],
  tabs: ['tab-bar'],
  'tab-pane': ['tabs'],
  'swiper-item': ['swiper'],
}

// iconfont 内嵌：@font-face 的 src 描述符里 var() 不被解析（CSS 规范限制，
// Chrome/WKWebView 均如此），必须内联字面量。构建期把 var(--icon-font-family)
// 替换为 base64 data-URI（woff 5.8KB，离线可用；字体与 token --icon-font-family
// 的远程 URL 同源同版本 mand-mobile-iconfont 2.6.0）
const ICON_FONT_B64 = readFileSync(join(PKG, 'assets/mand-mobile-iconfont.woff')).toString('base64')

function embedIconFont(css) {
  return css.replace(
    /src:var\(--icon-font-family\)/g,
    `src:url(data:font/woff;base64,${ICON_FONT_B64}) format("woff")`,
  )
}

/** px→rpx 恒等换算；url(...) 内部（svg data-URI 的几何定义）不换算 */
export function pxToRpx(css) {
  return css.replace(/url\([^)]*\)|(-?\d*\.?\d+)px\b/g, (match, num) => {
    if (num === undefined) return match // url(...) 原样保留
    if (Number(num) === 0) return '0'
    return `${num}rpx`
  })
}

function compileStylus(source, filename) {
  return new Promise((resolveP, reject) => {
    const style = stylus(source).set('filename', filename).set('paths', [join(STYLES_SRC, 'mixin')])
    for (const imp of ['theme.css-vars.styl', 'util.styl'].map(f => join(STYLES_SRC, 'mixin', f))) {
      if (existsSync(imp)) style.import(imp)
    }
    style.render((err, css) => (err ? reject(err) : resolveP(css)))
  })
}

async function processCss(css, fromPath, toPath) {
  const result = await postcss([
    autoprefixer({ overrideBrowserslist: BROWSERS }),
    // 与主包同 preset：zindex/discardUnused 关闭（对齐 v2），cssnano 负责梯度角度
    // 归一（to right → 90deg）等规范化，保证泄漏扫描与主包产物一致
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

async function compileStyl(name, srcPath) {
  const raw = await compileStylus(readFileSync(srcPath, 'utf8'), srcPath)
  const css = embedIconFont(await processCss(raw, srcPath, join(DIST, `${name}.wxss`)))
  const leaks = scanLeaks(css).map(l => `${l.prop}: ${l.ident}`)
  if (leaks.length > 0) {
    throw new Error(`[${name}] 未解析 token 泄漏：${[...new Set(leaks)].join('、')}`)
  }
  return css
}

export async function buildStyles() {
  const theme = new ThemeTokens(STYLES_SRC)
  mkdirSync(join(DIST, 'styles'), { recursive: true })
  mkdirSync(join(DIST, 'components'), { recursive: true })

  // tokens.wxss：全量默认值，:root → page（小程序根选择器），px→rpx 恒等换算
  const allTokens = new Set(theme.map.keys())
  const rootBlock = await processCss(
    theme.rootBlock(allTokens),
    join(DIST, 'tokens.css'),
    join(DIST, 'tokens.wxss'),
  )
  writeFileSync(join(DIST, 'styles/tokens.wxss'), pxToRpx(rootBlock.replaceAll(':root', 'page')))

  // global.wxss：scoped-reset（html/body 选择器在小程序中无效但无害）+ 平台 shim
  const reset = await compileStyl('scoped-reset', join(STYLES_SRC, 'scoped-reset.styl'))
  const shim = [
    '/* @centui/wechat 平台 shim —— 小程序与 Web 的差异补齐（勿手工编辑） */',
    '/* 原生 button 默认样式重置（对齐 Web 端 .cu-button 的 reset 语义） */',
    'button { padding: 0; margin: 0; background: transparent; color: inherit; font-size: inherit; line-height: inherit; border-radius: 0; overflow: visible; }',
    'button::after { border: none; }',
    '/* icon 渲染为 iconfont（.icon-font 分支，字体 base64 内嵌于 icon.wxss）；',
    '   mask-image 方案在开发者工具渲染层不受支持（实测 3.8.0），已弃用 */',
    '/* SMIL 自旋转图标的 CSS 近似（spinner 等） */',
    '@keyframes cu-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
    '.cu-icon-spinner, .icon-font.cu-icon-spinner { animation: cu-rotate 0.8s linear infinite; }',
    '',
  ].join('\n')
  writeFileSync(join(DIST, 'styles/global.wxss'), shim + pxToRpx(reset))

  // 组件 wxss
  const components = readdirSync(join(PKG, 'src/components')).filter(d =>
    existsSync(join(PKG, 'src/components', d, 'index.ts')),
  )
  let built = 0
  const missing = []
  for (const name of components) {
    const srcPath = join(STYLES_SRC, 'components', `${name}.styl`)
    const outPath = join(DIST, 'components', name, 'index.wxss')
    mkdirSync(dirname(outPath), { recursive: true })
    let css
    try {
      if (!existsSync(srcPath)) {
        missing.push(name)
        css = '/* TODO: 缺少 stylus 源（packages/styles/src/components/' + name + '.styl） */\n'
      } else {
        const deps = DEP_STYLES[name] ?? []
        const parts = [await compileStyl(name, srcPath)]
        for (const dep of deps) parts.push(await compileStyl(`${name}+${dep}`, join(STYLES_SRC, 'components', `${dep}.styl`)))
        css = parts.join('\n')
      }
      writeFileSync(
        outPath,
        `@import "../../styles/tokens.wxss";\n@import "../../styles/global.wxss";\n\n` + pxToRpx(css),
      )
      built++
    } catch (err) {
      console.error(`FAIL styles/${name}: ${err.message}`)
      process.exitCode = 1
    }
  }
  console.log(`styles: ${built}/${components.length} 组件 wxss + tokens.wxss + global.wxss` +
    (missing.length ? `（缺 styl 源：${missing.join('、')}）` : ''))
}
