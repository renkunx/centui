/**
 * image-viewer 纯逻辑测试（对照 Vue 版 ImageViewer.vue imgsInit 归一化）。
 */
import {describe, it, expect} from 'vitest'
import {normalizeList} from '../../src/components/image-viewer/logic'

describe('image-viewer/normalizeList（imgsInit）', () => {
  it('字符串项包装为 {url}', () => {
    expect(normalizeList(['https://a.png', 'https://b.png'])).toEqual([
      {url: 'https://a.png'},
      {url: 'https://b.png'},
    ])
  })

  it('对象项透传（url/alt/cls）', () => {
    const list = [{url: 'https://a.png', alt: 'A', cls: 'x'}]
    const result = normalizeList(list)
    expect(result).toEqual(list)
    expect(result[0]).toBe(list[0])
  })

  it('混合与边界：null 项、非数组输入', () => {
    expect(normalizeList(['https://a.png', {url: 'https://b.png'}])).toEqual([
      {url: 'https://a.png'},
      {url: 'https://b.png'},
    ])
    expect(normalizeList([null])).toEqual([{url: ''}])
    expect(normalizeList(undefined)).toEqual([])
    expect(normalizeList('not-array')).toEqual([])
  })
})
