<script setup lang="ts">
import { ref } from 'vue'
import { CuSteps, CuIcon } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '进度非整数', '指定当前步骤', '自定义图标', '进度动效', '完成全部', '纵向展示']
const code = `<CuSteps :steps="steps" />
<CuSteps :steps="steps" :current="1.2" />
<CuSteps :steps="steps" :current="2" transition />`
const steps = [
  { name: '登录/注册' },
  { name: '申请征信报告' },
  { name: '提取征信报告' },
]
const stepsNonInt = [{ name: '登录' }, { name: '开通' }, { name: '验证' }]
const currentStep = ref(0)
function triggerTransition() {
  currentStep.value = 2
}
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuSteps :steps="steps" />
    </template>
    <template #scene-1>
      <CuSteps :steps="stepsNonInt" :current="1.2" />
    </template>
    <template #scene-2>
      <CuSteps :steps="steps" :current="2" />
    </template>
    <template #scene-3>
      <div style="display: flex; flex-direction: column; gap: 32px; width: 100%">
        <CuSteps :steps="steps" :current="2">
          <template #icon="{ index, currentIndex }">
            <b v-if="index === currentIndex" style="color: #198cff">{{ index }}</b>
            <span v-else>{{ index }}</span>
          </template>
        </CuSteps>
        <CuSteps :steps="steps" :current="2">
          <template #reached="{ index }">
            <CuIcon v-if="index === 1" name="checked" />
            <div v-else class="step-node-default">
              <div class="step-node-default-icon" style="width: 6px; height: 6px; border-radius: 50%"></div>
            </div>
          </template>
          <template #current>
            <CuIcon name="location" />
          </template>
          <template #unreached>
            <CuIcon name="time" />
          </template>
        </CuSteps>
      </div>
    </template>
    <template #scene-4>
      <div style="width: 100%">
        <CuSteps :steps="steps" :current="currentStep" transition />
        <CuButton size="small" inline @click="triggerTransition">current = 2</CuButton>
      </div>
    </template>
    <template #scene-5>
      <CuSteps :steps="steps" :current="3" />
    </template>
    <template #scene-6>
      <CuSteps :steps="steps" :current="1" direction="vertical" />
    </template>
  </DemoCanvas>
</template>
