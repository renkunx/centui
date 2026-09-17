<script setup lang="ts">
import { ref } from 'vue'
import { MdIcon } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['常用图标', '状态图标', '尺寸与颜色']
const code = `<MdIcon name="home" size="lg" />
<MdIcon name="success-color" size="lg" color="#35C454" />
<MdIcon name="search" svg />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="icon-grid">
        <MdIcon v-for="n in ['home', 'search', 'location', 'mobile-phone', 'id-card', 'card-bag', 'security', 'time', 'discovery', 'profession', 'arrow-right', 'question']" :key="n" :name="n" size="lg" />
      </div>
    </template>
    <template #scene-1>
      <div class="icon-grid">
        <MdIcon name="success-color" size="lg" />
        <MdIcon name="warn-color" size="lg" />
        <MdIcon name="fail-color" size="lg" />
        <MdIcon name="info-solid" size="lg" />
        <MdIcon name="checked" size="lg" color="#2F86F6" />
        <MdIcon name="check-disabled" size="lg" />
        <MdIcon name="spinner" size="lg" color="#2F86F6" :svg="false" />
        <MdIcon name="ring" size="lg" color="#A7A7A7" />
      </div>
    </template>
    <template #scene-2>
      <div class="icon-column">
        <div class="icon-line"><MdIcon name="home" size="xs" /><MdIcon name="home" size="sm" /><MdIcon name="home" size="md" /><MdIcon name="home" size="lg" /><MdIcon name="home" size="xl" /></div>
        <div class="icon-line">
          <MdIcon name="arrow-left" size="lg" color="#2F86F6" />
          <MdIcon name="arrow-left" size="lg" color="#FF9F0F" />
          <MdIcon name="arrow-left" size="lg" color="#35C454" />
          <MdIcon name="arrow-left" size="lg" color="#F5222D" />
        </div>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px 8px;
  padding: 12px;
}
.icon-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 12px;
}
.icon-line {
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>