<template>
  <div class="pg">
    <h1>mand-mobile v3 playground</h1>
    <p class="pg-tip">首批 12 个组件 · Vue 3 + @mand-mobile/styles（与 v2 同源 CSS）</p>

    <section>
      <h2>Button</h2>
      <MdButton type="primary">主要按钮</MdButton>
      <MdButton type="warning" plain>次要按钮</MdButton>
      <MdButton type="primary" round inline size="small">圆角小按钮</MdButton>
      <MdButton type="primary" loading>加载中</MdButton>
      <MdButton type="primary" icon="rmb" inline>图标按钮</MdButton>
    </section>

    <section>
      <h2>Icon</h2>
      <div class="icons">
        <MdIcon name="home" size="lg" />
        <MdIcon name="location" size="lg" />
        <MdIcon name="arrow" />
        <MdIcon name="success-color" size="lg" />
        <MdIcon name="spinner" />
      </div>
    </section>

    <section>
      <h2>Tag</h2>
      <div class="tags">
        <MdTag size="tiny" type="fill">标签</MdTag>
        <MdTag size="small" type="ghost">标签</MdTag>
        <MdTag shape="fillet" type="fill" fill-color="#fc9153">优惠</MdTag>
        <MdTag shape="quarter" fill-color="#fc9153">首</MdTag>
      </div>
    </section>

    <section>
      <h2>Amount</h2>
      <p class="amounts">
        <MdAmount :value="1234.56" />
        <MdAmount :value="1234.56" has-separator />
        <MdAmount :value="1234.56" is-capital />
      </p>
    </section>

    <section>
      <h2>CellItem</h2>
      <MdCellItem title="单元格" brief="描述文案" addon="内容" arrow />
      <MdCellItem title="无边框" no-border>
        <template #right>自定义</template>
      </MdCellItem>
    </section>

    <section>
      <h2>NoticeBar</h2>
      <MdNoticeBar mode="closable">为了确保你的资金安全，请设置支付密码</MdNoticeBar>
    </section>

    <section>
      <h2>ActivityIndicator / Progress</h2>
      <div class="indicators">
        <MdActivityIndicator type="roller" text="加载中..." />
        <MdActivityIndicator type="spinner" />
        <MdActivityIndicator type="carousel" />
        <MdProgress :value="progress" />
      </div>
    </section>

    <section>
      <h2>Skeleton</h2>
      <MdSkeleton v-if="skeletonLoading" avatar :row="2" title loading />
      <div v-else class="loaded" @click="skeletonLoading = true">内容加载完成，点击重新加载</div>
    </section>

    <section>
      <h2>Switch / Agree / Stepper</h2>
      <div class="forms">
        <MdSwitch v-model="switchOn" />
        <MdAgree v-model="agreeOn">我已阅读并同意协议</MdAgree>
        <MdStepper v-model="stepperNum" :min="0" :max="10" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  MdActivityIndicator,
  MdAgree,
  MdAmount,
  MdButton,
  MdCellItem,
  MdIcon,
  MdNoticeBar,
  MdProgress,
  MdSkeleton,
  MdStepper,
  MdSwitch,
  MdTag,
} from '@'

const switchOn = ref(true)
const agreeOn = ref(false)
const stepperNum = ref(3)
const skeletonLoading = ref(true)
const progress = ref(0.2)

let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => {
    progress.value = Math.round(((progress.value + 0.1) % 1.1) * 100) / 100
  }, 800)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style>
body {
  margin: 0;
  background: #f3f4f5;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}
.pg {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px 60px;
}
.pg h1 {
  font-size: 22px;
}
.pg-tip {
  color: #999;
  font-size: 13px;
  margin: 4px 0 24px;
}
.pg section {
  margin-bottom: 32px;
}
.pg h2 {
  font-size: 16px;
  color: #666;
  margin: 16px 0 12px;
}
.pg .md-button {
  margin-bottom: 12px;
}
.icons > * {
  margin-right: 16px;
  vertical-align: middle;
}
.tags > * {
  margin-right: 12px;
}
.amounts > * {
  margin-right: 24px;
  font-size: 18px;
}
.indicators > * {
  margin-right: 24px;
  vertical-align: middle;
  display: inline-block;
}
.forms > * {
  margin: 16px 0;
}
.loaded {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  color: #666;
}
</style>
