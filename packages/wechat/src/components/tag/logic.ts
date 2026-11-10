/**
 * tag 纯逻辑：类名/内联样式构建（对照 Vue 版 Tag.vue 的 computed 与 refreshCircleSize）
 */

export interface TagProps {
  size: string
  shape: string
  sharp: string
  type: string
  fillColor: string
  fontWeight: string
  fontColor: string
}

/** Vue computedClass：['default', `size-${size}`, `shape-${shape}`, `type-${type}`, `font-weight-${fontWeight}`] */
export function buildComputedClass(p: Pick<TagProps, 'size' | 'shape' | 'type' | 'fontWeight'>): string {
  return `default size-${p.size} shape-${p.shape} type-${p.type} font-weight-${p.fontWeight}`
}

/** Vue colorStyle：fill+fillColor → background；fontColor → ghost 加 border-color，始终 color */
export function buildColorStyle(p: Pick<TagProps, 'type' | 'fillColor' | 'fontColor'>): string {
  let style = ''
  if (p.type === 'fill' && p.fillColor) {
    style += `background:${p.fillColor};`
  }
  if (p.fontColor) {
    if (p.type === 'ghost') {
      style += `border-color:${p.fontColor};`
    }
    style += `color:${p.fontColor};`
  }
  return style
}

/** Vue coupon 左右缺口的径向渐变（fillColor 为空时 style 为空，节点仍渲染） */
export function buildCouponStyle(fillColor: string, side: 'left' | 'right'): string {
  if (!fillColor) {
    return ''
  }
  const at = side === 'left' ? 'left' : 'right'
  return `background:radial-gradient(circle at ${at}, transparent 33%, ${fillColor} 33%);`
}

/**
 * Vue refreshCircleSize：circle 形状按内容高度重算内边距/圆角
 * （radius = height/2；sharp 切角置 0）。返回 null 表示无需更新（高度未变）。
 */
export function buildCircleStyle(
  height: number,
  sharp: string,
  lastHeight: number,
): {style: string; height: number} | null {
  if (height === lastHeight) {
    return null
  }
  const radius = height / 2
  let style = `padding-left:${radius}px;padding-right:${radius}px;border-radius:${radius}px;`
  if (sharp) {
    // Vue transformCamelCase(`border-${sharp}-radius`) —— style 字符串直接用 kebab 原名
    style += `border-${sharp}-radius:0;`
  }
  return {style, height}
}
