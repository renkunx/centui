<script setup lang="ts">
import { ref } from 'vue'
import { MdDatePicker, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['日期选择', '时间选择', '日期时间', '常驻视图']

const show1 = ref(false)
const show2 = ref(false)
const show3 = ref(false)
const show4 = ref(true)

const dp1 = ref<InstanceType<typeof MdDatePicker>>()
const dp2 = ref<InstanceType<typeof MdDatePicker>>()
const dp3 = ref<InstanceType<typeof MdDatePicker>>()
const dp4 = ref<InstanceType<typeof MdDatePicker>>()

const result1 = ref('')
const result2 = ref('')
const result3 = ref('')
const result4 = ref('')

function onConfirm1() {
  result1.value = dp1.value?.getFormatDate('yyyy-MM-dd') ?? ''
  result4.value = result1.value
}
function onConfirm2() {
  result2.value = dp2.value?.getFormatDate('hh:mm') ?? ''
}
function onConfirm3() {
  result3.value = dp3.value?.getFormatDate('yyyy-MM-dd hh:mm') ?? ''
}
function onChange4() {
  result4.value = dp4.value?.getFormatDate('yyyy-MM-dd hh:mm') ?? ''
}

const today = new Date()
const twoYearsLater = new Date(today.getFullYear() + 2, 11, 31)

const code = `<MdDatePicker v-model="show" type="date" @confirm="onConfirm" />
<MdDatePicker v-model="show" type="time" @confirm="onConfirm" />
<MdDatePicker v-model="show" type="datetime" :min-date="min" :max-date="max" @confirm="onConfirm" />
<MdDatePicker v-model="show" is-view type="datetime" :default-date="today" @change="onChange" />`
</script>

<template>
  <DemoCanvas mode="phone" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="dp-pad">
        <MdButton type="primary" round @click="show1 = true">选择日期</MdButton>
        <div class="dp-note">{{ result1 || '未选择' }}</div>
      </div>
      <MdDatePicker
        ref="dp1"
        v-model="show1"
        type="date"
        title="选择日期"
        @confirm="onConfirm1"
      />
    </template>
    <template #scene-1>
      <div class="dp-pad">
        <MdButton type="warning" round @click="show2 = true">选择时间</MdButton>
        <div class="dp-note">{{ result2 || '未选择' }}</div>
      </div>
      <MdDatePicker ref="dp2" v-model="show2" type="time" title="选择时间" @confirm="onConfirm2" />
    </template>
    <template #scene-2>
      <div class="dp-pad">
        <MdButton type="primary" round @click="show3 = true">选择日期时间</MdButton>
        <div class="dp-note">{{ result3 || '未选择' }}</div>
      </div>
      <MdDatePicker
        ref="dp3"
        v-model="show3"
        type="datetime"
        title="选择日期与时间"
        :min-date="today"
        :max-date="new Date(today.getFullYear() + 2, 11, 31)"
        @confirm="onConfirm3"
      />
    </template>
    <template #scene-3>
      <div class="dp-pad">
        <div class="dp-note">常驻视图，滚动即时回显：{{ result4 || '未选择' }}</div>
        <MdDatePicker
          ref="dp4"
          v-model="show4"
          type="datetime"
          is-view
          :default-date="today"
          @change="onChange4"
        />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.dp-pad {
  padding: 20px 16px;
}
.dp-note {
  margin-top: 12px;
  font-size: 13px;
  color: #999;
}
</style>