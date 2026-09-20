<script setup lang="ts">
import { CuNoticeBar, CuIcon } from 'centui'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '设置图标', '定时隐藏', '圆角', '主题样式', '多行显示', '滚动播放', '自定义插槽']
const code = `<CuNoticeBar>为了确保您的资金安全，请设置支付密码</CuNoticeBar>
<CuNoticeBar mode="closable" icon="security">...</CuNoticeBar>
<CuNoticeBar round>...</CuNoticeBar>
<CuNoticeBar multi-rows>...</CuNoticeBar>
<CuNoticeBar scrollable>...</CuNoticeBar>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <CuNoticeBar>为了确保您的资金安全，请设置支付密码</CuNoticeBar>
    </template>
    <template #scene-1>
      <CuNoticeBar mode="closable" icon="security">为了确保您的资金安全，请设置支付密码</CuNoticeBar>
    </template>
    <template #scene-2>
      <CuNoticeBar :time="5000">为了确保您的资金安全，请设置支付密码（5s 后隐藏）</CuNoticeBar>
    </template>
    <template #scene-3>
      <CuNoticeBar round>为了确保您的资金安全，请设置支付密码</CuNoticeBar>
    </template>
    <template #scene-4>
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%">
        <CuNoticeBar icon="warn" mode="closable" type="warning">该银行3:00-12:00系统维护，请更换其他银行卡</CuNoticeBar>
        <CuNoticeBar icon="coupon" mode="link" type="activity">福利来啦，7日免息券发放中！</CuNoticeBar>
      </div>
    </template>
    <template #scene-5>
      <CuNoticeBar mode="link" icon="security" multi-rows>
        为了确保您的资金安全，请设置支付密码。为了确保您的资金安全，请设置支付密码。为了确保您的资金安全，请设置支付密码。
      </CuNoticeBar>
    </template>
    <template #scene-6>
      <CuNoticeBar mode="closable" icon="volumn" scrollable>
        为了确保您的资金安全，请设置支付密码为了确保您的资金安全，请设置支付密码为了确保您的资金安全，请设置支付密码
      </CuNoticeBar>
    </template>
    <template #scene-7>
      <CuNoticeBar>
        <template #left>
          <CuIcon name="security" style="margin-right: 8px" />
        </template>
        为了确保您的资金安全，请设置支付密码
      </CuNoticeBar>
    </template>
  </DemoCanvas>
</template>
