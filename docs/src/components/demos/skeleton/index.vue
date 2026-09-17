<script setup lang="ts">
import { ref } from 'vue'
import { MdSkeleton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['加载中', '头像 + 标题', '加载完成']
const loading = ref(true)
const code = `<MdSkeleton :loading="loading" :row="4" />
<MdSkeleton :loading="loading" avatar title :row="3" />
<MdSkeleton :loading="loading" avatar :row="2">加载完成后的内容</MdSkeleton>`
setTimeout(() => (loading.value = false), 3200)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="sk-pad">
        <MdSkeleton :loading="loading" :row="3" title />
      </div>
    </template>
    <template #scene-1>
      <div class="sk-pad">
        <MdSkeleton :loading="loading" avatar :row="3" />
      </div>
    </template>
    <template #scene-2>
      <div class="sk-pad">
        <MdSkeleton :loading="loading" avatar title :row="2">
          <div class="loaded">
            <b>内容加载完成。</b>
            <p>骨架屏在数据到达前占位，到达后自动替换为真实内容。</p>
          </div>
        </MdSkeleton>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.sk-pad {
  padding: 14px;
  background: #fff;
}
.loaded {
  font-size: 14px;
  color: #2b2b2b;
}
.loaded p {
  margin: 8px 0 0;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.6;
}
</style>