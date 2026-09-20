<script setup lang="ts">
import { MdNoticeBar, MdIcon } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '设置图标', '定时隐藏', '圆角', '主题样式', '多行显示', '滚动播放', '自定义插槽']
const code = `<MdNoticeBar>为了确保您的资金安全，请设置支付密码</MdNoticeBar>
<MdNoticeBar mode="closable" icon="security">...</MdNoticeBar>
<MdNoticeBar round>...</MdNoticeBar>
<MdNoticeBar multi-rows>...</MdNoticeBar>
<MdNoticeBar scrollable>...</MdNoticeBar>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <MdNoticeBar>为了确保您的资金安全，请设置支付密码</MdNoticeBar>
    </template>
    <template #scene-1>
      <MdNoticeBar mode="closable" icon="security">为了确保您的资金安全，请设置支付密码</MdNoticeBar>
    </template>
    <template #scene-2>
      <MdNoticeBar :time="5000">为了确保您的资金安全，请设置支付密码（5s 后隐藏）</MdNoticeBar>
    </template>
    <template #scene-3>
      <MdNoticeBar round>为了确保您的资金安全，请设置支付密码</MdNoticeBar>
    </template>
    <template #scene-4>
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%">
        <MdNoticeBar icon="warn" mode="closable" type="warning">该银行3:00-12:00系统维护，请更换其他银行卡</MdNoticeBar>
        <MdNoticeBar icon="coupon" mode="link" type="activity">福利来啦，7日免息券发放中！</MdNoticeBar>
      </div>
    </template>
    <template #scene-5>
      <MdNoticeBar mode="link" icon="security" multi-rows>
        为了确保您的资金安全，请设置支付密码。为了确保您的资金安全，请设置支付密码。为了确保您的资金安全，请设置支付密码。
      </MdNoticeBar>
    </template>
    <template #scene-6>
      <MdNoticeBar mode="closable" icon="volumn" scrollable>
        为了确保您的资金安全，请设置支付密码为了确保您的资金安全，请设置支付密码为了确保您的资金安全，请设置支付密码
      </MdNoticeBar>
    </template>
    <template #scene-7>
      <MdNoticeBar>
        <template #left>
          <MdIcon name="security" style="margin-right: 8px" />
        </template>
        为了确保您的资金安全，请设置支付密码
      </MdNoticeBar>
    </template>
  </DemoCanvas>
</template>
