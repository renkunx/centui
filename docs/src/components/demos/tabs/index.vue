<script setup lang="ts">
import { ref } from 'vue'
import { MdTabs, MdTabPane } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '多标签']
const code = `<MdTabs v-model="current">
  <MdTabPane label="标签一" name="a">内容一</MdTabPane>
  <MdTabPane label="标签二" name="b">内容二</MdTabPane>
</MdTabs>`
const current = ref('a')
const many = ref('p1')
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdTabs v-model="current">
        <MdTabPane label="标签一" name="a">
          <p class="tabs-demo-content">标签一的内容</p>
        </MdTabPane>
        <MdTabPane label="标签二" name="b">
          <p class="tabs-demo-content">标签二的内容</p>
        </MdTabPane>
      </MdTabs>
    </template>
    <template #scene-1>
      <MdTabs v-model="many">
        <MdTabPane v-for="i in 6" :key="i" :label="`标签${i}`" :name="`p${i}`">
          <p class="tabs-demo-content">第 {{ i }} 个标签的内容</p>
        </MdTabPane>
      </MdTabs>
    </template>
  </DemoCanvas>
</template>
