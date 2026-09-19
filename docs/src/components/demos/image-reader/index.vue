<script setup lang="ts">
import { ref } from 'vue'
import { MdImageReader } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['文件选择']
const code = `<MdImageReader @select="onSelect" @complete="onComplete" @error="onError" />`
const msg = ref('')
function onSelect(name: string, d: { files: File[] }) {
  msg.value = `已选择 ${d.files.length} 个文件`
}
function onError(name: string, d: { code: string; msg: string }) {
  msg.value = `错误 ${d.code}: ${d.msg}`
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="image-reader-demo">
        <div class="image-reader-demo-box">
          <MdImageReader @select="onSelect" @error="onError" />
          <span class="image-reader-demo-tip">点击选择图片</span>
        </div>
        <p v-if="msg" class="image-reader-demo-msg">{{ msg }}</p>
      </div>
    </template>
  </DemoCanvas>
</template>
