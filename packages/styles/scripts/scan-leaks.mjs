/**
 * 编译产物「未解析 token 泄漏」扫描：
 * stylus 对未定义变量不报错、按字面量输出（如 icon-size-xxs 曾泄漏为
 * font-size:icon-size-xxs），浏览器静默丢弃非法声明——必须在构建期拦截。
 *
 * 规则：声明值中的裸 kebab-case 标识符（后随空白/逗号/右括号等终结符，
 * 排除函数名 ident( 与引号内内容），若不在 CSS 关键字白名单中即判为泄漏。
 * 语境豁免（值为自定义标识符的合法场景）：animation(-name)、transition(-property)、
 * will-change 的值为动画名/属性名；unicode-range 整体跳过；cu- 前缀为本库命名约定。
 */
import postcss from 'postcss'

const KEYWORDS = new Set([
  // CSS-wide / 通用
  'inherit', 'initial', 'unset', 'revert', 'none', 'auto', 'both', 'visible', 'hidden',
  // display
  'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'table',
  '-webkit-box', '-webkit-inline-box', '-webkit-flex', '-webkit-inline-flex',
  // 定位
  'absolute', 'relative', 'fixed', 'sticky',
  // 盒模型
  'border-box', 'content-box',
  // 文本 / 对齐
  'ellipsis', 'break-all', 'break-word', 'nowrap', 'wrap', 'center', 'left', 'right',
  'top', 'bottom', 'middle', 'justify', 'start', 'end', 'baseline', 'stretch',
  'flex-start', 'flex-end', 'space-between', 'space-around', 'uppercase', 'lowercase',
  'capitalize', 'underline',
  // 字体
  'sans-serif', 'serif', 'monospace', 'normal', 'bold', 'bolder', 'lighter',
  'antialiased', 'grayscale', 'crisp-edges',
  // 动画 / 过渡时序
  'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end',
  'infinite', 'forwards', 'backwards', 'alternate', 'running', 'paused',
  // 边框 / 颜色
  'solid', 'dashed', 'dotted', 'double', 'transparent', 'currentColor',
  // 光标
  'pointer', 'not-allowed', 'zoom-out', 'zoom-in', 'move', 'default', 'crosshair', 'text',
  // SVG / 形状
  'butt', 'square', 'round', 'evenodd', 'nonzero',
  // 滚动 / 背景
  'touch', 'contain', 'cover', 'invert', 'no-repeat', 'repeat', 'repeat-x', 'repeat-y',
  'scroll', 'fixed-position',
  // flex / grid 方向
  'row', 'column', 'row-reverse', 'column-reverse', 'horizontal', 'vertical',
  // 过渡属性名（transition: background .3s 等，见语境豁免外的兜底）
  'background', 'background-color', 'opacity', 'transform', 'color', 'scale', 'translate',
  'rotate', 'all',
  // env() 参数兜底
  'safe-area-inset-top', 'safe-area-inset-bottom', 'safe-area-inset-left', 'safe-area-inset-right',
])

/** 值为自定义标识符的属性（动画名、过渡属性名）——逐声明豁免 */
const FREE_IDENT_PROPS = /(?:^|-)(?:animation|animation-name|transition|transition-property|will-change)$/

/** 剥离不参与判定的片段：引号字符串、url()、attr()/env()/constant()/format()/local() 的参数 */
function stripIgnorable(value) {
  return value
    .replace(/"[^"]*"|'[^']*'/g, '""')
    .replace(/url\([^)]*\)/gi, 'url()')
    .replace(/\b(attr|env|constant|format|local)\([^)]*\)/gi, '$1()')
}

const IDENT = /(^|[\s,:(/!])(-?[a-z][a-z0-9-]*)(?=$|[\s,;)}!])/g

/**
 * @returns {{prop: string, ident: string}[]} 泄漏列表
 */
export function scanLeaks(css) {
  const leaks = []
  postcss.parse(css).walkDecls(decl => {
    if (decl.prop === 'unicode-range') return
    const freeIdent = FREE_IDENT_PROPS.test(decl.prop)
    const value = stripIgnorable(decl.value)
    for (const m of value.matchAll(IDENT)) {
      const ident = m[2]
      if (freeIdent || ident.startsWith('cu-') || KEYWORDS.has(ident)) continue
      leaks.push({ prop: decl.prop, ident })
    }
  })
  return leaks
}
