<script setup lang="ts">
import { ref } from 'vue'
import { CuField, CuCellItem, CuButton, Toast } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础表单', '分组', '无边框']
const code = `<CuField title="个人信息">
  <CuCellItem title="姓名" arrow />
  <CuCellItem title="手机号" arrow />
</CuField>
<CuField :disabled="false">
  <template #header>注意</template>
  <CuCellItem title="职业" arrow />
</CuField>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="fld-list">
        <CuField title="个人信息">
          <CuCellItem title="姓名" arrow="1" @click="Toast.info('姓名入口')" />
          <CuCellItem title="手机号" arrow="1" @click="Toast.info('手机号入口')" />
          <CuCellItem title="所在城市" arrow="1" @click="Toast.info('城市入口')" />
        </CuField>
        <CuField title="账户安全">
          <CuCellItem title="登录密码" arrow="1" />
          <CuCellItem title="支付密码" arrow="1" />
        </CuField>
      </div>
    </template>
    <template #scene-1>
      <div class="fld-list">
        <CuField :disabled="true">
          <template #header>只读分组</template>
          <CuCellItem title="不可编辑的项" disabled />
        </CuField>
        <CuField title="带 action 的分组">
          <template #action><CuButton type="primary" size="small" @click="Toast.success('已保存')">保存</CuButton></template>
          <CuCellItem title="编辑个人资料" arrow="1" />
        </CuField>
      </div>
    </template>
    <template #scene-2>
      <div class="fld-list">
        <CuField plain>
          <CuCellItem title="无边框样式" no-border />
          <CuCellItem title="适用于卡片场景" no-border />
        </CuField>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.fld-list {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>