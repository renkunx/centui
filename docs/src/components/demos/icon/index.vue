<script setup lang="ts">
import { CuIcon } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['字体图标', 'SVG 图标', '大小', '颜色']
const code = `<CuIcon :name="icon" size="lg" />
<CuIcon :name="icon" size="lg" svg />
<CuIcon :name="icon" size="xs|sm|md|lg" />
<CuIcon name="security" color="orange" />`
const iconList = [
  'square-checked', 'square-check', 'rectangle', 'right', 'wrong', 'arrow',
  'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down', 'invisible', 'visible',
  'service', 'setting', 'close', 'refresh', 'edit', 'sort', 'info', 'question',
  'security', 'rmb', 'wait', 'check', 'checked', 'check-disabled', 'clear',
  'success', 'fail', 'location', 'calendar', 'user', 'bank-zs', 'bank-ny',
]
const sizes = ['xs', 'sm', 'md', 'lg']
const colors = ['gray', 'orange', 'blue', 'green', 'red']
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="icon-demo-grid">
        <div v-for="icon in iconList" :key="icon" class="icon-demo-item">
          <CuIcon :name="icon.split('/')[0]" size="lg" />
          <p>{{ icon }}</p>
        </div>
      </div>
    </template>
    <template #scene-1>
      <div class="icon-demo-grid">
        <div v-for="icon in ['spinner', 'warn-color', 'success-color', 'checked']" :key="icon" class="icon-demo-item">
          <CuIcon :name="icon" size="lg" svg />
          <p>{{ icon }}</p>
        </div>
      </div>
    </template>
    <template #scene-2>
      <div class="icon-demo-grid">
        <div v-for="s in sizes" :key="s" class="icon-demo-item">
          <CuIcon :name="'location'" :size="s" />
          <p>{{ s }}</p>
        </div>
      </div>
    </template>
    <template #scene-3>
      <div class="icon-demo-grid">
        <div v-for="c in colors" :key="c" class="icon-demo-item">
          <CuIcon name="security" :color="c" />
          <p>{{ c }}</p>
        </div>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.icon-demo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px 0;
}
.icon-demo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  color: #666;
}
</style>
