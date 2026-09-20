<template>
  <div class="pg">
    <h1>centui v3 playground</h1>
    <p class="pg-tip">首批 12 个组件 · Vue 3 + @centui/styles（与 v2 同源 CSS）</p>

    <section>
      <h2>Button</h2>
      <CuButton type="primary">主要按钮</CuButton>
      <CuButton type="warning" plain>次要按钮</CuButton>
      <CuButton type="primary" round inline size="small">圆角小按钮</CuButton>
      <CuButton type="primary" loading>加载中</CuButton>
      <CuButton type="primary" icon="rmb" inline>图标按钮</CuButton>
    </section>

    <section>
      <h2>Icon</h2>
      <div class="icons">
        <CuIcon name="home" size="lg" />
        <CuIcon name="location" size="lg" />
        <CuIcon name="arrow" />
        <CuIcon name="success-color" size="lg" />
        <CuIcon name="spinner" />
      </div>
    </section>

    <section>
      <h2>Tag</h2>
      <div class="tags">
        <CuTag size="tiny" type="fill">标签</CuTag>
        <CuTag size="small" type="ghost">标签</CuTag>
        <CuTag shape="fillet" type="fill" fill-color="#fc9153">优惠</CuTag>
        <CuTag shape="quarter" fill-color="#fc9153">首</CuTag>
      </div>
    </section>

    <section>
      <h2>Amount</h2>
      <p class="amounts">
        <CuAmount :value="1234.56" />
        <CuAmount :value="1234.56" has-separator />
        <CuAmount :value="1234.56" is-capital />
      </p>
    </section>

    <section>
      <h2>CellItem</h2>
      <CuCellItem title="单元格" brief="描述文案" addon="内容" arrow />
      <CuCellItem title="无边框" no-border>
        <template #right>自定义</template>
      </CuCellItem>
    </section>

    <section>
      <h2>NoticeBar</h2>
      <CuNoticeBar mode="closable">为了确保你的资金安全，请设置支付密码</CuNoticeBar>
    </section>

    <section>
      <h2>ActivityIndicator / Progress</h2>
      <div class="indicators">
        <CuActivityIndicator type="roller" text="加载中..." />
        <CuActivityIndicator type="spinner" />
        <CuActivityIndicator type="carousel" />
        <CuProgress :value="progress" />
      </div>
    </section>

    <CuPopup v-model="popupShow" position="bottom">
      <div class="popup-panel">
        <CuPopupTitleBar title="底部弹层" only-close @cancel="popupShow = false" />
        <p style="padding: 40px; text-align: center">弹层内容</p>
      </div>
    </CuPopup>

    <CuActionSheet
      v-model="sheetShow"
      title="操作弹层"
      :options="[{ text: '选项一' }, { text: '选项二' }, { text: '禁用项' }]"
      :invalid-index="2"
      @selected="onSelected"
    />

    <CuDialog
      v-model="dialogVisible"
      title="对话框"
      content="这是一个对话框"
      :btns="[
        { text: '取消', handler: () => (dialogVisible = false) },
        { text: '确定', handler: () => (dialogVisible = false) },
      ]"
    />

    <section>
      <h2>Skeleton</h2>
      <CuSkeleton v-if="skeletonLoading" avatar :row="2" title loading />
      <div v-else class="loaded" @click="skeletonLoading = true">内容加载完成，点击重新加载</div>
    </section>

    <section>
      <h2>Popup / ActionSheet / Dialog / Toast / Tip</h2>
      <div class="popups">
        <CuButton size="small" inline @click="popupShow = true">底部弹层</CuButton>
        <CuButton size="small" inline @click="sheetShow = true">ActionSheet</CuButton>
        <CuButton size="small" inline @click="dialogVisible = true">Dialog</CuButton>
        <CuButton size="small" inline @click="showToast">Toast</CuButton>
      </div>
      <CuTip content="点击我试试气泡提示">
        <CuButton size="small" inline>Tip 触发</CuButton>
      </CuTip>
    </section>

    <section>
      <h2>Check / Radio / Field</h2>
      <CuField title="结算周期" brief="Field 内的 Check/Radio">
        <CuCheckGroup v-model="checkValues">
          <CuCheck name="day">日结算</CuCheck>
          <CuCheck name="week">周结算</CuCheck>
          <CuCheck name="month" disabled>月结算</CuCheck>
        </CuCheckGroup>
        <CuRadioGroup v-model="radioValue">
          <CuRadio name="0" inline>按单</CuRadio>
          <CuRadio name="1" inline>按期</CuRadio>
        </CuRadioGroup>
      </CuField>
    </section>

    <section>
      <h2>Switch / Agree / Stepper</h2>
      <div class="forms">
        <CuSwitch v-model="switchOn" />
        <CuAgree v-model="agreeOn">我已阅读并同意协议</CuAgree>
        <CuStepper v-model="stepperNum" :min="0" :max="10" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  CuActionSheet,
  CuActivityIndicator,
  CuAgree,
  CuAmount,
  CuButton,
  CuCellItem,
  CuCheck,
  CuCheckGroup,
  CuDialog,
  CuField,
  CuIcon,
  CuNoticeBar,
  CuPopup,
  CuPopupTitleBar,
  CuProgress,
  CuRadio,
  CuRadioGroup,
  CuSkeleton,
  CuStepper,
  CuSwitch,
  CuTag,
  CuTip,
  Toast,
} from '@'

const popupShow = ref(false)
const sheetShow = ref(false)
const dialogVisible = ref(false)
const checkValues = ref<Array<string | number | boolean>>(['day'])
const radioValue = ref<string | number | boolean>('0')

function showToast() {
  Toast.succeed('操作成功')
}

function onSelected(option: { text?: string }) {
  Toast.info(`选择了：${option.text}`)
}

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
.pg .cu-button {
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
.popups {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.popup-panel {
  background: #fff;
}
.loaded {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  color: #666;
}
</style>
