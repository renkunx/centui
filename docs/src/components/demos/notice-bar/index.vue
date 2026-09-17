<script setup lang="ts">
import { MdNoticeBar } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['基础', '可关闭', '圆角', '滚动播报']
const code = `<MdNoticeBar>优惠活动开始啦，全场 8 折起，快来选购吧</MdNoticeBar>
<MdNoticeBar mode="link" closable>点击查看活动规则</MdNoticeBar>
<MdNoticeBar type="activity" round>新人专享 188 元礼包</MdNoticeBar>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="nb-list">
        <MdNoticeBar>系统维护通知：本周六 02:00-06:00 暂停服务</MdNoticeBar>
        <MdNoticeBar icon="sound">下单前请确认收货地址</MdNoticeBar>
        <MdNoticeBar type="activity">您的账户已完成实名认证</MdNoticeBar>
      </div>
    </template>
    <template #scene-1>
      <div class="nb-list">
        <MdNoticeBar closable>该公告可以手动关闭</MdNoticeBar>
        <MdNoticeBar mode="link" closable>点击查看活动详情</MdNoticeBar>
      </div>
    </template>
    <template #scene-2>
      <div class="nb-list">
        <MdNoticeBar round>圆角样式适用于弹层 / 卡片内嵌</MdNoticeBar>
        <MdNoticeBar type="activity" round>满 300 减 60，上不封顶</MdNoticeBar>
      </div>
    </template>
    <template #scene-3>
      <div class="nb-list">
        <MdNoticeBar scrollable>这是一条很长很长的滚动公告，用于展示超长文本时的跑马灯效果，文字会循环滚动播放。</MdNoticeBar>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.nb-list {
  padding: 14px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>