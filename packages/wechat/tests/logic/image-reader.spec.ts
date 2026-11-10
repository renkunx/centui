/**
 * image-reader 纯逻辑测试：体积校验字节估算（对齐修复后的语义）、dataURL 组装、
 * chooseMedia 参数映射（count/sourceType）、错误码表。
 * 对照 Vue 版 ImageReader.vue 的 read()/dataURItoBlob/props 映射。
 * 另含组件层（index.ts）：wx.chooseMedia / FileSystemManager 桩驱动的拾取管线
 * （select → 103 张数校验 → 逐张 readFile → 101 体积校验 → complete / 102 读取失败）。
 */
import {describe, it, expect, afterEach} from 'vitest'
import {
  buildDataUrl,
  chooseCount,
  estimateBytesFromBase64,
  IMAGE_READER_ERRORS,
  isSizeBeyondLimit,
  mimeForPath,
  sourceTypeOf,
} from '../../src/components/image-reader/logic'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/image-reader/index'))

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

  it('mimeForPath：空路径兜底 image/png（filePath || \'\' 分支）', () => {
    expect(mimeForPath('')).toBe('image/png')
  })
})

/* -------------------------------------------------------------------------
 * 组件层（index.ts）：wx.chooseMedia / FileSystemManager 桩（globalThis.wx 补桩）
 * ---------------------------------------------------------------------- */

interface ReadCall {
  filePath: string
  encoding: string
  success?: (res: {data: string}) => void
  fail?: () => void
}

/** chooseMedia 桩捕获的调用载荷（success/fail 由测试按场景驱动） */
interface ChooseCall {
  success?: (res: unknown) => void
  fail?: (res?: {errMsg?: string} | undefined) => void
  [k: string]: unknown
}

/** wx 桩容器（weapp.ts 已预置 wx 基座；此处仅替换/恢复两个 API） */
interface WxStubBag {
  chooseMedia?: (opts: ChooseCall) => void
  getFileSystemManager?: () => {readFile: (opts: ReadCall) => void}
  [k: string]: unknown
}

const g = globalThis as unknown as {wx: WxStubBag}

function installWxStubs() {
  const chooseCalls: ChooseCall[] = []
  const reads: ReadCall[] = []
  const prevChoose = g.wx.chooseMedia
  const prevFs = g.wx.getFileSystemManager
  g.wx.chooseMedia = (opts: ChooseCall) => {
    chooseCalls.push(opts)
  }
  g.wx.getFileSystemManager = () => ({
    readFile: (opts: ReadCall) => {
      reads.push(opts)
    },
  })
  return {
    chooseCalls,
    reads,
    restore() {
      g.wx.chooseMedia = prevChoose
      g.wx.getFileSystemManager = prevFs
    },
  }
}

const FILE_A = {tempFilePath: 'wxfile://tmp/a.png', size: 4}
const FILE_B = {tempFilePath: 'wxfile://tmp/b.jpg', size: 4}

describe('image-reader 组件', () => {
  afterEach(() => {
    g.wx.chooseMedia = undefined
    g.wx.getFileSystemManager = undefined
  })

  it('attached：默认生成 image-reader-随机串；显式 name 透传', () => {
    const anon = mountDef(comp.def)
    anon.attached()
    expect(anon.data.readerName).toMatch(/^image-reader-\d+$/)

    const named = mountDef(comp.def, {props: {name: 'avatar'}})
    named.attached()
    expect(named.data.readerName).toBe('avatar')
  })

  it('onChoose：chooseMedia 参数映射（count/sourceType/mediaType）', () => {
    const stubs = installWxStubs()
    try {
      const single = mountDef(comp.def)
      single.attached()
      single.methods.onChoose.call(single)
      expect(stubs.chooseCalls[0]).toMatchObject({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
      })

      const multi = mountDef(comp.def, {props: {isMultiple: true, amount: 3, isCameraOnly: true}})
      multi.attached()
      multi.methods.onChoose.call(multi)
      expect(stubs.chooseCalls[1]).toMatchObject({count: 3, sourceType: ['camera']})
    } finally {
      stubs.restore()
    }
  })

  it('拾取成功管线：select → readFile → complete（base64/dataUrl 载荷）', () => {
    const stubs = installWxStubs()
    try {
      const inst = mountDef(comp.def, {props: {name: 'n1'}})
      inst.attached()
      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[0].success!({tempFiles: [FILE_A]})
      expect(inst.eventsOf('select')).toEqual([
        {name: 'select', detail: {name: 'n1', files: [FILE_A]}},
      ])
      expect(stubs.reads).toHaveLength(1)
      expect(stubs.reads[0]).toMatchObject({filePath: 'wxfile://tmp/a.png', encoding: 'base64'})
      stubs.reads[0].success!({data: 'AAAA'})
      expect(inst.eventsOf('complete')[0].detail).toEqual({
        name: 'n1',
        file: FILE_A,
        url: 'wxfile://tmp/a.png',
        base64: 'AAAA',
        dataUrl: 'data:image/png;base64,AAAA',
      })
    } finally {
      stubs.restore()
    }
  })

  it('多选：逐张读取各自 complete（扩展名决定 dataUrl MIME）', () => {
    const stubs = installWxStubs()
    try {
      const inst = mountDef(comp.def, {props: {isMultiple: true}})
      inst.attached()
      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[0].success!({tempFiles: [FILE_A, FILE_B]})
      expect(stubs.reads).toHaveLength(2)
      stubs.reads[0].success!({data: 'AAAA'})
      stubs.reads[1].success!({data: 'BB'})
      const completes = inst.eventsOf('complete')
      expect(completes).toHaveLength(2)
      expect((completes[0].detail as {dataUrl: string}).dataUrl).toBe('data:image/png;base64,AAAA')
      expect((completes[1].detail as {dataUrl: string}).dataUrl).toBe('data:image/jpeg;base64,BB')
    } finally {
      stubs.restore()
    }
  })

  it('__handleFiles：空结果（取消后空数组）不发 select', () => {
    const stubs = installWxStubs()
    try {
      const inst = mountDef(comp.def)
      inst.attached()
      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[0].success!({tempFiles: []})
      expect(inst.events).toEqual([])
    } finally {
      stubs.restore()
    }
  })

  it('超量校验（103）：amount=1 选 2 张 → 报错终止，不读取', () => {
    const stubs = installWxStubs()
    try {
      const inst = mountDef(comp.def, {props: {amount: 1, isMultiple: true}})
      inst.attached()
      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[0].success!({tempFiles: [FILE_A, FILE_B]})
      expect(inst.eventsOf('select')).toHaveLength(1)
      expect(inst.eventsOf('error')[0].detail).toEqual({
        name: inst.data.readerName,
        code: '103',
        msg: IMAGE_READER_ERRORS['103'],
      })
      expect(stubs.reads).toHaveLength(0)
    } finally {
      stubs.restore()
    }
  })

  it('体积校验（101）：size 限制内 base64 超限 → 报错且不发 complete', () => {
    const stubs = installWxStubs()
    try {
      const inst = mountDef(comp.def, {props: {size: 1}}) // 1KB = 1000 字节
      inst.attached()
      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[0].success!({tempFiles: [FILE_A]})
      stubs.reads[0].success!({data: 'A'.repeat(4000)}) // 3000 字节 > 1000
      expect(inst.eventsOf('error')[0].detail).toEqual({
        name: inst.data.readerName,
        code: '101',
        msg: IMAGE_READER_ERRORS['101'],
      })
      expect(inst.eventsOf('complete')).toEqual([])
    } finally {
      stubs.restore()
    }
  })

  it('读取失败（102）：readFile fail → error 102', () => {
    const stubs = installWxStubs()
    try {
      const inst = mountDef(comp.def)
      inst.attached()
      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[0].success!({tempFiles: [FILE_A]})
      stubs.reads[0].fail!()
      expect(inst.eventsOf('error')[0].detail).toEqual({
        name: inst.data.readerName,
        code: '102',
        msg: IMAGE_READER_ERRORS['102'],
      })
    } finally {
      stubs.restore()
    }
  })

  it('chooseMedia fail：用户取消静默；其他错误 → error 102', () => {
    const stubs = installWxStubs()
    try {
      const inst = mountDef(comp.def)
      inst.attached()
      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[0].fail!({errMsg: 'chooseMedia:fail cancel'})
      expect(inst.events).toEqual([])

      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[1].fail!({errMsg: 'chooseMedia:fail boom'})
      expect((inst.eventsOf('error')[0].detail as {code: string}).code).toBe('102')

      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[2].fail!({}) // errMsg 缺失 → 非取消路径
      expect((inst.eventsOf('error')[1].detail as {code: string}).code).toBe('102')

      inst.methods.onChoose.call(inst)
      stubs.chooseCalls[3].fail!(undefined) // res 缺失 → 非取消路径
      expect((inst.eventsOf('error')[2].detail as {code: string}).code).toBe('102')
    } finally {
      stubs.restore()
    }
  })
})
