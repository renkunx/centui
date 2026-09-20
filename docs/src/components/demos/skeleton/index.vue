<script setup lang="ts">
import { ref } from 'vue'
import { MdSkeleton, MdCellItem } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['加载正文', '组合骨架', '组合完整内容']
const code = `<MdSkeleton title :loading="loading" />
<MdSkeleton avatar title />
<MdSkeleton avatar title :loading="loading" :row="2">
  <MdCellItem title="交通银行" brief="展示摘要描述" />
</MdSkeleton>`
const loading = ref(true)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdSkeleton title :loading="loading" />
    </template>
    <template #scene-1>
      <MdSkeleton avatar title :loading="loading" />
    </template>
    <template #scene-2>
      <MdField>
        <MdSkeleton avatar title :loading="loading" :row="2" class="skeleton-item">
          <MdCellItem title="交通银行" brief="展示摘要描述" addon="附加文案" arrow />
        </MdSkeleton>
        <MdSkeleton avatar title :loading="loading" :row="2" class="skeleton-item">
          <MdCellItem title="招商银行" brief="展示摘要描述" addon="附加文案" arrow />
        </MdSkeleton>
      </MdField>
    </template>
  </DemoCanvas>
</template>
