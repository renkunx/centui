<script setup lang="ts">
import { ref } from 'vue'
import { CuSkeleton, CuCellItem } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['加载正文', '组合骨架', '组合完整内容']
const code = `<CuSkeleton title :loading="loading" />
<CuSkeleton avatar title />
<CuSkeleton avatar title :loading="loading" :row="2">
  <CuCellItem title="交通银行" brief="展示摘要描述" />
</CuSkeleton>`
const loading = ref(true)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuSkeleton title :loading="loading" />
    </template>
    <template #scene-1>
      <CuSkeleton avatar title :loading="loading" />
    </template>
    <template #scene-2>
      <CuField>
        <CuSkeleton avatar title :loading="loading" :row="2" class="skeleton-item">
          <CuCellItem title="交通银行" brief="展示摘要描述" addon="附加文案" arrow />
        </CuSkeleton>
        <CuSkeleton avatar title :loading="loading" :row="2" class="skeleton-item">
          <CuCellItem title="招商银行" brief="展示摘要描述" addon="附加文案" arrow />
        </CuSkeleton>
      </CuField>
    </template>
  </DemoCanvas>
</template>
