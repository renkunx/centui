/**
 * Source: packages/vue/src/components/image-reader/ImageReader.vue
 *
 * 映射：
 *  props    name(`image-reader-${random}`), size(0, KB 限制), mime([]), isCameraOnly(false),
 *           isMultiple(false), amount(0, 每次张数上限)
 *  events   select({name, files}) / complete({name, file, url, base64, dataUrl}) /
 *           error({name, code, msg})——Vue 为 emit(event, name, data) 双参，小程序
 *           triggerEvent 单载荷，name 字段并入载荷首字段（语义对齐）
 *  slots    无（组件本身是覆盖在调用方容器上的透明拾取层）
 *
 * 平台差异：
 *  1. <input type="file"> → wx.chooseMedia（mediaType: ['image']）：sourceType 按
 *     isCameraOnly 映射（['camera'] / ['album','camera']）；count 按 isMultiple+amount
 *     映射（amount=0 的「不限制」在平台上限 9）。选择须由用户手势触发——组件根节点
 *     即透明覆盖层（.cu-image-reader 样式与 Vue 版一致），tap 触发拾取。
 *  2. mime（accept 过滤）为 no-op：chooseMedia 无法按扩展名过滤，仅选图片
 *     （属性保留对齐 API）。
 *  3. 载荷字段对齐：select.files 为 chooseMedia MediaFile[]（含 tempFilePath/size，
 *     对应 Vue File[]）；complete 携带 file（MediaFile）、url（tempFilePath）、
 *     base64（FileSystemManager.readFile encoding:'base64'）、dataUrl（dataURI，
 *     对应 Vue dataUrl）；blob 为 Web 概念，无对应（不携带）。
 *  4. 体积校验对齐修复后的字节估算：base64 解码字节数（estimateBytesFromBase64）
 *     对比 size*1000（Vue 直接以 dataUrl 字符长度对比，含前缀、未解码，为已知偏差）。
 *  5. Vue complete 前的 Image onload 解码校验无对应（102 仅在 readFile 失败时触发）；
 *     chooseMedia 失败且非用户取消时 emit error 102（Vue 无此场景）。
 */
import {CuComponent} from '../../shared/component'
import {
  buildDataUrl,
  chooseCount,
  isSizeBeyondLimit,
  IMAGE_READER_ERRORS,
  sourceTypeOf,
} from './logic'

type MediaFile = {
  tempFilePath: string
  size: number
  fileType?: string
}

function emitter(
  self: {data: Record<string, unknown>; triggerEvent(name: string, payload?: unknown): void},
  event: 'select' | 'complete' | 'error',
  data: Record<string, unknown>,
) {
  self.triggerEvent(event, {name: self.data.readerName, ...data})
}

CuComponent({
  options: {virtualHost: true},

  properties: {
    /** Vue 缺省为随机串（image-reader-xxxx）；小程序属性默认值静态，attached 生成 */
    name: {type: String, value: ''},
    /** 单张体积限制（KB），0 为不限制 */
    size: {type: null, value: 0},
    /** Web accept 语义 no-op（chooseMedia 无法按扩展名过滤） */
    mime: {type: Object, value: []},
    isCameraOnly: {type: Boolean, value: false},
    isMultiple: {type: Boolean, value: false},
    /** 每次选择张数上限，0 为不限制（平台按 9 处理） */
    amount: {type: Number, value: 0},
  },

  data: {
    readerName: '',
  },

  lifetimes: {
    attached() {
      if (!this.data.name) {
        // 对齐 Vue 默认值：`image-reader-${Math.floor(Math.random() * 10000)}`
        this.setData({
          readerName: `image-reader-${Math.floor(Math.random() * 10000)}`,
        })
      } else {
        this.setData({readerName: this.data.name})
      }
    },
  },

  methods: {
    /** 根节点 tap（Vue input change 的触发入口） */
    onChoose() {
      wx.chooseMedia({
        count: chooseCount(this.data.isMultiple, this.data.amount),
        mediaType: ['image'],
        sourceType: sourceTypeOf(this.data.isCameraOnly),
        success: (res) => {
          this.__handleFiles(res.tempFiles as unknown as MediaFile[])
        },
        fail: (res) => {
          // 用户取消不视为错误（Vue 取消选择同样静默）
          if (res && res.errMsg && res.errMsg.indexOf('cancel') !== -1) {
            return
          }
          emitter(this, 'error', {code: '102', msg: IMAGE_READER_ERRORS['102']})
        },
      })
    },

    /** Vue onFileChange：select → 超量校验（103）→ 逐张读取 */
    __handleFiles(files: MediaFile[]) {
      if (!files || !files.length) {
        return
      }
      emitter(this, 'select', {files})

      // 超出每次上传最大张数（Vue 103 分支：报错并终止）
      if (this.data.amount && files.length > this.data.amount) {
        emitter(this, 'error', {code: '103', msg: IMAGE_READER_ERRORS['103']})
        return
      }

      const fs = wx.getFileSystemManager()
      for (const file of files) {
        this.__readFile(fs, file)
      }
    },

    /** Vue read()：base64 读取 → 体积校验（101）→ complete（102 兜底） */
    __readFile(fs: WechatMiniprogram.FileSystemManager, file: MediaFile) {
      fs.readFile({
        filePath: file.tempFilePath,
        encoding: 'base64',
        success: (res) => {
          const base64 = String(res.data)
          if (isSizeBeyondLimit(base64, Number(this.data.size) || 0)) {
            emitter(this, 'error', {code: '101', msg: IMAGE_READER_ERRORS['101']})
            return
          }
          emitter(this, 'complete', {
            file,
            url: file.tempFilePath,
            base64,
            dataUrl: buildDataUrl(base64, file.tempFilePath),
          })
        },
        fail: () => {
          emitter(this, 'error', {code: '102', msg: IMAGE_READER_ERRORS['102']})
        },
      })
    },
  },
})
