<script setup lang="ts">
/**
 * 演示画布：phone（手机壳，fixed 弹层以 frame 为 containing block）
 * 或 stage（自由区域）模式渲染场景槽位，底部可切换场景并展示源码。
 */
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    scenes: string[]
    code?: string
    mode?: 'phone' | 'stage'
    minHeight?: number
  }>(),
  { code: '', mode: 'phone', minHeight: 0 },
)

const active = ref(0)

function go(i: number) {
  active.value = i
  window.scrollTo({ top: window.scrollY, behavior: 'smooth' })
}
</script>

<template>
  <div class="demo-canvas">
    <div v-if="mode === 'phone'" class="demo-canvas__frame">
      <div class="phone-frame" :style="{ minHeight: minHeight ? minHeight + 'px' : undefined }">
        <div class="phone-frame__screen">
          <slot :name="'scene-' + active" />
        </div>
      </div>
    </div>
    <div v-else class="demo-stage" :style="{ minHeight: minHeight ? minHeight + 'px' : undefined }">
      <slot :name="'scene-' + active" />
    </div>

    <div v-if="scenes.length > 1" class="demo-switcher">
      <button
        v-for="(s, i) in scenes"
        :key="i"
        type="button"
        :class="{ 'is-active': i === active }"
        @click="go(i)"
      >
        {{ s }}
      </button>
    </div>

    <pre v-if="code" class="demo-code"><code>{{ code }}</code></pre>
  </div>
</template>