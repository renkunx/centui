<script setup lang="ts">
import { ref } from 'vue'
import { MdAgree, MdIcon, Toast } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['复选框', '协议条款', '禁用']
const first = ref(true)
const second = ref(false)
const third = ref(false)
const code = `<MdAgree v-model="first" label="同意用户协议" />
<MdAgree v-model="second" label="我已阅读并同意" />`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="ag-line">
        <MdAgree v-model="first" label="记住登录状态" />
      </div>
      <div class="ag-line">
        <MdAgree v-model="second" icon-type="square" label="勾选皮肤" />
      </div>
    </template>
    <template #scene-1>
      <div class="ag-line">
        <MdAgree v-model="third" label="我已阅读并同意" />
        <div class="ag-desc">{{ third ? '已同意，可进入下一步' : '未同意，无法进行下一步' }}</div>
      </div>
    </template>
    <template #scene-2>
      <div class="ag-line">
        <MdAgree disabled label="不可勾选" />
      </div>
      <div class="ag-line ag-plain">
        <MdAgree disabled :model-value="false" label="已勾选但禁用" />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.ag-line {
  padding: 12px 14px;
  font-size: 14px;
  color: #333;
}
.ag-plain {
  padding-top: 0;
}
.ag-desc {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>