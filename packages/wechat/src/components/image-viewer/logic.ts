/**
 * image-viewer 纯逻辑（对照 Vue 版 ImageViewer.vue imgsInit）
 */

export interface ImageViewerItem {
  url?: string
  alt?: string
  cls?: string
}

/** Vue imgsInit：list 归一化为 {url} 对象（字符串项包装，对象项透传） */
export function normalizeList(list: unknown): ImageViewerItem[] {
  if (!Array.isArray(list)) return []
  return list.map(item =>
    item && typeof item === 'object' ? (item as ImageViewerItem) : {url: String(item ?? '')},
  )
}
