import defaultSvgList from './default-svg-list'

// inspired by https://github.com/kisenka/svg-sprite-loader/blob/master/runtime/browser-sprite.js
// Much simplified, do make sure run this after document ready
const SPRITE_NODE_ID = '__MAND_MOBILE_SVG_SPRITE_NODE__'

const svgSprite = (contents: string): string => `
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  id="${SPRITE_NODE_ID}"
  style="position:absolute;width:0;height:0"
>
  <defs>
    ${contents}
  </defs>
</svg>
`

const renderSvgSprite = (): string => {
  const symbols = Object.keys(defaultSvgList)
    .map(iconName => {
      const svgContent = defaultSvgList[iconName].split('svg')[1]
      return `<symbol id=${iconName}${svgContent}symbol>`
    })
    .join('')
  return svgSprite(symbols)
}

/**
 * 首次使用 svg 图标时向 body 注入 sprite（幂等）
 */
export function loadSprite(): void {
  if (typeof document === 'undefined') {
    return
  }
  const existing = document.getElementById(SPRITE_NODE_ID)

  if (!existing) {
    document.body.insertAdjacentHTML('afterbegin', renderSvgSprite())
  }
}

export { SPRITE_NODE_ID }
