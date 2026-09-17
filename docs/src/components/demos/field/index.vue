<script setup lang="ts">
import { ref } from 'vue'
import { MdField, MdCellItem, MdButton, Toast } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础表单', '分组', '无边框']
const code = `<MdField title="个人信息">
  <MdCellItem title="姓名" arrow />
  <MdCellItem title="手机号" arrow />
</MdField>
<MdField :disabled="false">
  <template #header>注意</template>
  <MdCellItem title="职业" arrow />
</MdField>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="fld-list">
        <MdField title="个人信息">
          <MdCellItem title="姓名" arrow="1" @click="Toast.info('姓名入口')" />
          <MdCellItem title="手机号" arrow="1" @click="Toast.info('手机号入口')" />
          <MdCellItem title="所在城市" arrow="1" @click="Toast.info('城市入口')" />
        </MdField>
        <MdField title="账户安全">
          <MdCellItem title="登录密码" arrow="1" />
          <MdCellItem title="支付密码" arrow="1" />
        </MdField>
      </div>
    </template>
    <template #scene-1>
      <div class="fld-list">
        <MdField :disabled="true">
          <template #header>只读分组</template>
          <MdCellItem title="不可编辑的项" disabled />
        </MdField>
        <MdField title="带 action 的分组">
          <template #action><MdButton type="primary" size="small" @click="Toast.success('已保存')">保存</MdButton></template>
          <MdCellItem title="编辑个人资料" arrow="1" />
        </MdField>
      </div>
    </template>
    <template #scene-2>
      <div class="fld-list">
        <MdField plain>
          <MdCellItem title="无边框样式" no-border />
          <MdCellItem title="适用于卡片场景" no-border />
        </MdField>
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