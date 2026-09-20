<script setup lang="ts">
import { ref } from 'vue'
import { CuCellItem, CuSwitch, CuIcon, Toast } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '图标与箭头', '开关', '无边框']
const code = `<CuCellItem title="标题" brief="描述文字" />
<CuCellItem title="标题" arrow />
<CuCellItem title="自动续费">
  <template #right><CuSwitch v-model="ok" /></template>
</CuCellItem>`
const ok = ref(true)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="cell-pad">
        <CuCellItem title="姓名" brief="张三" />
        <CuCellItem title="手机号" brief="138****8888" />
        <CuCellItem title="家庭住址" brief="北京市朝阳区望京 SOHO 塔 1" />
        <CuCellItem title="无描述的行" />
      </div>
    </template>
    <template #scene-1>
      <div class="cell-pad">
        <CuCellItem title="订单详情" arrow @click="Toast.info('点击了订单详情')" />
        <CuCellItem title="我的优惠券" addon="3 张" arrow />
        <CuCellItem title="明细">
          <template #left><CuIcon name="card-bag" color="#2F86F6" /></template>
          <template #right><CuIcon name="arrow-right" color="#BBBBBB" /></template>
        </CuCellItem>
        <CuCellItem title="设置" arrow @click="Toast.info('暂未开放', 2000, false)" />
      </div>
    </template>
    <template #scene-2>
      <div class="cell-pad">
        <CuCellItem title="自动续费" arrow>
          <template #right><CuSwitch v-model="ok" /></template>
        </CuCellItem>
        <CuCellItem title="推送通知" arrow>
          <template #right><CuSwitch v-model="ok" disabled /></template>
        </CuCellItem>
      </div>
    </template>
    <template #scene-3>
      <div class="cell-pad">
        <CuCellItem title="白色背景卡片" no-border />
        <CuCellItem title="无下划线" no-border arrow />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.cell-pad {
  padding: 10px 0;
}
</style>