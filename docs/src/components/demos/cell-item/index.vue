<script setup lang="ts">
import { ref } from 'vue'
import { MdCellItem, MdSwitch, MdIcon, Toast } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '图标与箭头', '开关', '无边框']
const code = `<MdCellItem title="标题" brief="描述文字" />
<MdCellItem title="标题" arrow />
<MdCellItem title="自动续费">
  <template #right><MdSwitch v-model="ok" /></template>
</MdCellItem>`
const ok = ref(true)
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="cell-pad">
        <MdCellItem title="姓名" brief="张三" />
        <MdCellItem title="手机号" brief="138****8888" />
        <MdCellItem title="家庭住址" brief="北京市朝阳区望京 SOHO 塔 1" />
        <MdCellItem title="无描述的行" />
      </div>
    </template>
    <template #scene-1>
      <div class="cell-pad">
        <MdCellItem title="订单详情" arrow @click="Toast.info('点击了订单详情')" />
        <MdCellItem title="我的优惠券" addon="3 张" arrow />
        <MdCellItem title="明细">
          <template #left><MdIcon name="card-bag" color="#2F86F6" /></template>
          <template #right><MdIcon name="arrow-right" color="#BBBBBB" /></template>
        </MdCellItem>
        <MdCellItem title="设置" arrow @click="Toast.info('暂未开放', 2000, false)" />
      </div>
    </template>
    <template #scene-2>
      <div class="cell-pad">
        <MdCellItem title="自动续费" arrow>
          <template #right><MdSwitch v-model="ok" /></template>
        </MdCellItem>
        <MdCellItem title="推送通知" arrow>
          <template #right><MdSwitch v-model="ok" disabled /></template>
        </MdCellItem>
      </div>
    </template>
    <template #scene-3>
      <div class="cell-pad">
        <MdCellItem title="白色背景卡片" no-border />
        <MdCellItem title="无下划线" no-border arrow />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.cell-pad {
  padding: 10px 0;
}
</style>