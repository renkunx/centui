/**
 * image-reader 纯逻辑测试：体积校验字节估算（对齐修复后的语义）、dataURL 组装、
 * chooseMedia 参数映射（count/sourceType）、错误码表。
 * 对照 Vue 版 ImageReader.vue 的 read()/dataURItoBlob/props 映射。
 */
import {describe, it, expect} from 'vitest'
import {
  buildDataUrl,
  chooseCount,
  estimateBytesFromBase64,
  IMAGE_READER_ERRORS,
  isSizeBeyondLimit,
  mimeForPath,
  sourceTypeOf,
} from '../../src/components/image-reader/logic'

describe('image-reader/estimateBytesFromBase64（修复后的字节估算）', () => {
  it('无补位的整组：4 字符 = 3 字节', () => {
    expect(estimateBytesFromBase64('AAAA')).toBe(3)
    expect(estimateBytesFromBase64('AAAAAAAA')).toBe(6)
  })

  it('含补位：AA== 1 字节、AAA= 2 字节', () => {
    expect(estimateBytesFromBase64('AA==')).toBe(1)
    expect(estimateBytesFromBase64('AAA=')).toBe(2)
  })

  it('空串与纯空白为 0', () => {
    expect(estimateBytesFromBase64('')).toBe(0)
    expect(estimateBytesFromBase64('  \n ')).toBe(0)
  })

  it('空白字符不计入（readFile 输出可能带换行）', () => {
    expect(estimateBytesFromBase64('AAAA\nBBBB')).toBe(6)
  })

  it('非法半组向下取整', () => {
    expect(estimateBytesFromBase64('A')).toBe(0)
    expect(estimateBytesFromBase64('AA')).toBe(1)
    expect(estimateBytesFromBase64('AAA')).toBe(2)
  })

  it('PNG 魔数嗅探口径：iVBORw0KGgo=（12 字符 1 补位 → 8 字节）', () => {
    expect(estimateBytesFromBase64('iVBORw0KGgo=')).toBe(8)
  })
})

describe('image-reader/isSizeBeyondLimit（Vue sizeLimit = size*1000）', () => {
  it('size=0 不限制（含超大 base64）', () => {
    expect(isSizeBeyondLimit('A'.repeat(999999), 0)).toBe(false)
  })

  it('字节估算对比 KB*1000：接近限制不限出、超出报限', () => {
    // 4n 字符（无补位）= 3n 字节：999,999 字节 ≤ 1,000,000（1000KB）→ 不限出
    const under = 'A'.repeat(4 * 333333) // 999,999 字节
    expect(estimateBytesFromBase64(under)).toBe(999999)
    expect(isSizeBeyondLimit(under, 1000)).toBe(false)
    // 再加一组（+3 字节 = 1,000,002）→ 超出
    expect(isSizeBeyondLimit(under + 'AAAA', 1000)).toBe(true)
    // 明显小于限制
    expect(isSizeBeyondLimit('AAAA', 1000)).toBe(false)
  })

  it('size 为字符串（Vue size?: string | number）按数字处理', () => {
    expect(isSizeBeyondLimit('AAAA', '2')).toBe(false)
    expect(isSizeBeyondLimit('A'.repeat(10000), '2')).toBe(true)
  })
})

describe('image-reader/dataURL 组装（Vue dataURItoBlob/dataUrl 语义）', () => {
  it('扩展名 → MIME 映射与默认兜底 image/png', () => {
    expect(mimeForPath('wxfile://tmp/1.png')).toBe('image/png')
    expect(mimeForPath('wxfile://tmp/1.JPG')).toBe('image/jpeg')
    expect(mimeForPath('wxfile://tmp/1.jpeg')).toBe('image/jpeg')
    expect(mimeForPath('http://x/a.webp?sign=1')).toBe('image/webp')
    expect(mimeForPath('http://x/no-ext')).toBe('image/png')
  })

  it('buildDataUrl 产出 data:image/...;base64 形态', () => {
    expect(buildDataUrl('AAAA', 'a.gif')).toBe('data:image/gif;base64,AAAA')
  })
})

describe('image-reader/chooseMedia 参数映射', () => {
  it('count：单选恒 1；多选受 amount 限制；amount=0 平台上限 9', () => {
    expect(chooseCount(false, 0)).toBe(1)
    expect(chooseCount(false, 5)).toBe(1)
    expect(chooseCount(true, 0)).toBe(9)
    expect(chooseCount(true, 3)).toBe(3)
  })

  it('sourceType：isCameraOnly 仅相机，否则相册+相机（Vue capture 语义）', () => {
    expect(sourceTypeOf(true)).toEqual(['camera'])
    expect(sourceTypeOf(false)).toEqual(['album', 'camera'])
  })
})

describe('image-reader/错误码表（Vue ERROR 常量）', () => {
  it('101/102/103 文案与 Vue 一致', () => {
    expect(IMAGE_READER_ERRORS['101']).toBe('picture size is beyond the preset')
    expect(IMAGE_READER_ERRORS['102']).toBe('picture read failure')
    expect(IMAGE_READER_ERRORS['103']).toBe('the number of pictures exceeds the limit')
  })
})
