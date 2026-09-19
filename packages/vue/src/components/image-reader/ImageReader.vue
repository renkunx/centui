<template>
  <div class="md-image-reader">
    <input
      :key="inputTmpKey"
      class="md-image-reader-file"
      type="file"
      :name="name"
      :accept="mimeType"
      :capture="isCameraOnly ? true : undefined"
      :multiple="isMultiple"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ name: 'md-image-reader' })

const ERROR: Record<string, string> = {
  '100': 'browser does not support',
  '101': 'picture size is beyond the preset',
  '102': 'picture read failure',
  '103': 'the number of pictures exceeds the limit',
}

const props = withDefaults(
  defineProps<{
    name?: string
    /** 单张图片体积限制（KB），0 为不限制 */
    size?: string | number
    mime?: string[]
    isCameraOnly?: boolean
    isMultiple?: boolean
    /** 每次选择张数上限，0 为不限制 */
    amount?: number
  }>(),
  {
    name: () => `image-reader-${Math.floor(Math.random() * 10000)}`,
    size: 0,
    mime: () => [],
    isCameraOnly: false,
    isMultiple: false,
    amount: 0,
  },
)

const emit = defineEmits<{
  (e: 'select', name: string, data: { files: File[] }): void
  (e: 'complete', name: string, data: { blob: Blob; dataUrl: string; file: File }): void
  (e: 'error', name: string, data: { code: string; msg: string }): void
}>()

const inputTmpKey = ref(Date.now())

const mimeType = computed(() => {
  if (props.mime.length) {
    let mimeStr = ''
    props.mime.forEach(type => {
      mimeStr += `image/${type},`
    })
    return mimeStr.substring(0, mimeStr.length - 1)
  }
  return 'image/*'
})

function emitter(event: 'select' | 'complete' | 'error', data: unknown) {
  emit(event as never, props.name, data as never)
}

function onFileChange(event: Event) {
  const fileElement = event.target as HTMLInputElement
  if (fileElement.files && fileElement.files.length) {
    emitter('select', { files: Array.prototype.slice.call(fileElement.files) })

    // 超出每次上传最大张数
    if (props.amount && fileElement.files.length > props.amount) {
      emitter('error', { code: '103', msg: ERROR['103'] })
      clearFile()
      return
    }

    readFile(fileElement)
  }
}

function readFile(fileElement: HTMLInputElement) {
  const sizeLimit = +props.size * 1000
  const files = fileElement.files
  if (!files || !files.length) {
    return
  }
  const total = files.length
  let done = 0
  Array.prototype.slice.call(files).forEach((file: File) => {
    read(file, sizeLimit, () => {
      done++
      if (done >= total) {
        clearFile()
      }
    })
  })
}

function read(file: File, sizeLimit: number, done: () => void) {
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = String(reader.result ?? '')
    if (sizeLimit && dataUrl.length > sizeLimit) {
      emitter('error', { code: '101', msg: ERROR['101'] })
      done()
      return
    }
    let img: HTMLImageElement | null = new Image()
    img.onload = () => {
      emitter('complete', {
        blob: dataURItoBlob(dataUrl),
        dataUrl,
        file,
      })
      img = null
      done()
    }
    img.onerror = () => {
      emitter('error', { code: '102', msg: ERROR['102'] })
      done()
    }
    img.src = dataUrl
  }
  reader.onerror = () => {
    emitter('error', { code: '102', msg: ERROR['102'] })
    done()
  }
  reader.readAsDataURL(file)
}

function dataURItoBlob(dataURI: string): Blob {
  const arr = dataURI.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/png'
  const bytes = window.atob(arr[1])
  let length = bytes.length
  const u8arr = new Uint8Array(length)
  while (length--) {
    u8arr[length] = bytes.charCodeAt(length)
  }
  return new Blob([u8arr], { type: mime })
}

function clearFile() {
  inputTmpKey.value = Date.now()
}
</script>
