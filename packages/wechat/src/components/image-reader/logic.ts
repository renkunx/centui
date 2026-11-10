/**
 * image-reader 纯逻辑（对照 Vue 版 ImageReader.vue 的错误码表、体积校验与
 * dataURL 组装；chooseMedia 参数映射）。
 */

/** Vue ERROR 表（100 仅浏览器语义，小程序不触达，保留映射完整性） */
export const IMAGE_READER_ERRORS: Record<string, string> = {
  '100': 'browser does not support',
  '101': 'picture size is beyond the preset',
  '102': 'picture read failure',
  '103': 'the number of pictures exceeds the limit',
}

/**
 * base64 字节估算（对齐修复后的字节估算语义）：base64 每 4 字符携带 3 字节，
 * 按 '=' 补位数量扣减；非法半组（无补位的尾随字符）向下取整。
 * Vue 版直接以 dataUrl.length（字符数，含前缀）对比 KB*1000，为已知偏差，
 * 小程序侧以解码后字节数为准。
 */
export function estimateBytesFromBase64(base64: string): number {
  const clean = base64.replace(/[\s]/g, '')
  if (!clean) {
    return 0
  }
  let padding = 0
  for (let i = clean.length - 1; i >= 0 && clean.charAt(i) === '='; i--) {
    padding++
  }
  return Math.max(Math.floor((clean.length * 3) / 4) - padding, 0)
}

/** Vue size 校验（sizeLimit = size * 1000，Vue 以 +props.size 收窄）：超出返回 true */
export function isSizeBeyondLimit(base64: string, sizeKB: number | string): boolean {
  const sizeLimit = Number(sizeKB || 0) * 1000
  return !!sizeLimit && estimateBytesFromBase64(base64) > sizeLimit
}

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
}

/** 临时文件路径 → MIME（Vue dataURItoBlob 的默认值 image/png 同款兜底） */
export function mimeForPath(filePath: string): string {
  const m = /\.([A-Za-z0-9]+)(?:\?|$)/.exec(filePath || '')
  const ext = m ? m[1].toLowerCase() : ''
  return MIME_MAP[ext] ?? 'image/png'
}

/** base64 → dataURL（Vue reader.readAsDataURL 的等价产物） */
export function buildDataUrl(base64: string, filePath: string): string {
  return `data:${mimeForPath(filePath)};base64,${base64}`
}

/** wx.chooseMedia 的 count：单选 1；多选受 amount 限制（0 为不限制 → 9，平台上限） */
export function chooseCount(isMultiple: boolean, amount: number): number {
  if (!isMultiple) {
    return 1
  }
  return amount > 0 ? amount : 9
}

/** wx.chooseMedia 的 sourceType：isCameraOnly 仅相机（Vue capture 属性语义） */
export function sourceTypeOf(isCameraOnly: boolean): Array<'camera' | 'album'> {
  return isCameraOnly ? ['camera'] : ['album', 'camera']
}
