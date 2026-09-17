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

    <MdPopup v-model="popupShow" position="bottom">
      <div class="popup-panel">
        <MdPopupTitleBar title="底部弹层" only-close @cancel="popupShow = false" />
        <p style="padding: 40px; text-align: center">弹层内容</p>
      </div>
    </MdPopup>

    <MdActionSheet
      v-model="sheetShow"
      title="操作弹层"
      :options="[{ text: '选项一' }, { text: '选项二' }, { text: '禁用项' }]"
      :invalid-index="2"
      @selected="onSelected"
    />

    <MdDialog
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
      <MdSkeleton v-if="skeletonLoading" avatar :row="2" title loading />
      <div v-else class="loaded" @click="skeletonLoading = true">内容加载完成，点击重新加载</div>
    </section>

    <section>
      <h2>Popup / ActionSheet / Dialog / Toast / Tip</h2>
      <div class="popups">
        <MdButton size="small" inline @click="popupShow = true">底部弹层</MdButton>
        <MdButton size="small" inline @click="sheetShow = true">ActionSheet</MdButton>
        <MdButton size="small" inline @click="dialogVisible = true">Dialog</MdButton>
        <MdButton size="small" inline @click="showToast">Toast</MdButton>
      </div>
      <MdTip content="点击我试试气泡提示">
        <MdButton size="small" inline>Tip 触发</MdButton>
      </MdTip>
    </section>

    <section>
      <h2>Check / Radio / Field</h2>
      <MdField title="结算周期" brief="Field 内的 Check/Radio">
        <MdCheckGroup v-model="checkValues">
          <MdCheck name="day">日结算</MdCheck>
          <MdCheck name="week">周结算</MdCheck>
          <MdCheck name="month" disabled>月结算</MdCheck>
        </MdCheckGroup>
        <MdRadioGroup v-model="radioValue">
          <MdRadio name="0" inline>按单</MdRadio>
          <MdRadio name="1" inline>按期</MdRadio>
        </MdRadioGroup>
      </MdField>
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
  MdActionSheet,
  MdActivityIndicator,
  MdAgree,
  MdAmount,
  MdButton,
  MdCellItem,
  MdCheck,
  MdCheckGroup,
  MdDialog,
  MdField,
  MdIcon,
  MdNoticeBar,
  MdPopup,
  MdPopupTitleBar,
  MdProgress,
  MdRadio,
  MdRadioGroup,
  MdSkeleton,
  MdStepper,
  MdSwitch,
  MdTag,
  MdTip,
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
