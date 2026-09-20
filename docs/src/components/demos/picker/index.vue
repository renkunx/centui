<script setup lang="ts">
import { ref } from 'vue'
import { MdPicker, MdButton } from 'mand-mobile'
import { Toast } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['单列选择', '多列选择', '级联选择', '内联展示']

const show1 = ref(false)
const show2 = ref(false)
const show3 = ref(false)
const picker1 = ref('')
const picker2 = ref('')

// 单列：城市列表
const data1 = [
  { text: '北京', value: '110000' },
  { text: '上海', value: '310000' },
  { text: '广州', value: '440100' },
  { text: '深圳', value: '440300' },
  { text: '杭州', value: '330100' },
  { text: '成都', value: '510100' },
  { text: '武汉', value: '420100' },
]

// 多列（不联动）：月份 + 奖学金档位
const data2 = [
  Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), text: `${i + 1} 月` })),
  [
    { value: '0', text: '一等奖学金' },
    { value: '1', text: '二等奖学金' },
    { value: '2', text: '三等奖学金' },
  ],
]

// 级联：省 → 城市（children 结构）
const data3 = [
  [
    {
      text: '浙江省',
      value: '330000',
      children: [
        { text: '杭州市', value: '330100' },
        { text: '宁波市', value: '330200' },
        { text: '温州市', value: '330300' },
        { text: '绍兴市', value: '330600' },
      ],
    },
    {
      text: '广东省',
      value: '440000',
      children: [
        { text: '广州市', value: '440100' },
        { text: '深圳市', value: '440300' },
        { text: '珠海市', value: '440400' },
        { text: '佛山市', value: '440600' },
      ],
    },
    {
      text: '四川省',
      value: '510000',
      children: [
        { text: '成都市', value: '510100' },
        { text: '绵阳市', value: '510700' },
        { text: '乐山市', value: '511100' },
      ],
    },
  ],
]

function onConfirm1(values: Array<{ text?: string } | undefined>) {
  picker1.value = values
    .map(v => v?.text ?? '')
    .filter(Boolean)
    .join(' / ')
  Toast.info(`已选择：${picker1.value}`)
}
function onConfirm2(values: Array<{ text?: string } | undefined>) {
  picker2.value = values
    .map(v => v?.text ?? '')
    .filter(Boolean)
    .join(' / ')
  Toast.info(`已选择：${picker2.value}`)
}
function onConfirm3(values: Array<{ text?: string } | undefined>) {
  Toast.success(`已选择：${values.map(v => v?.text).join(' / ')}`)
}

const code = `<MdPicker v-model="show" title="选择城市" :data="[data1]" @confirm="onConfirm" />
<MdPicker v-model="show" title="多列" :data="data2" :cols="2" @confirm="onConfirm" />
<MdPicker v-model="show" title="地区" :data="data3" :cols="2" is-cascade @confirm="onConfirm" />`
</script>

<template>
  <DemoCanvas mode="phone" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="pk-pad">
        <MdButton type="primary" round @click="show1 = true">选择城市</MdButton>
        <div class="pk-note">{{ picker1 || '未选择' }}</div>
      </div>
      <MdPicker
        v-model="show1"
        title="选择城市"
        describe="单选一列数据"
        :data="[data1]"
        @confirm="onConfirm1"
      />
    </template>
    <template #scene-1>
      <div class="pk-pad">
        <MdButton type="warning" round @click="show2 = true">选择月份与档位</MdButton>
        <div class="pk-note">{{ picker2 || '未选择' }}</div>
      </div>
      <MdPicker v-model="show2" :data="data2" :cols="2" @confirm="onConfirm2" />
    </template>
    <template #scene-2>
      <div class="pk-pad">
        <MdButton type="primary" round @click="show3 = true">选择省市</MdButton>
      </div>
      <MdPicker
        v-model="show3"
        title="选择地区"
        :data="data3"
        :cols="2"
        is-cascade
        keep-index
        @confirm="onConfirm3"
      />
    </template>
    <template #scene-3>
      <div class="pk-pad">
        <p style="font-size: 24px; color: #999; margin-bottom: 12px">内联选择器（is-view）</p>
        <MdPicker :data="[data1]" is-view @confirm="onConfirm1" />
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.pk-pad {
  padding: 20px 16px;
}
.pk-note {
  margin-top: 12px;
  font-size: 13px;
  color: #999;
}
</style>