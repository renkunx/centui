<template>
  <div class="md-cashier">
    <MdPopup
      class="inner-popup"
      v-model="isCashierShow"
      position="bottom"
      :mask-closable="false"
      prevent-scroll-exclude=".choose-channel"
      prevent-scroll
      @show="$emit('show')"
      @hide="onPopupHide"
    >
      <MdPopupTitleBar
        :title="title"
        :describe="describe"
        :large-radius="largeRadius"
        only-close
        @cancel="onPopupCancel"
      ></MdPopupTitleBar>
      <div class="md-cashier-container">
        <slot name="header" :scene="scene"></slot>

        <!-- 选择支付渠道 -->
        <div v-if="scene === 'choose'" :key="sceneKey" class="md-cashier-block md-cashier-choose">
          <MdCashierChannel
            :payment-title="paymentTitle"
            :payment-amount="paymentAmount"
            :payment-describe="paymentDescribe"
            :more-button-text="moreButtonText"
            :pay-button-text="payButtonText"
            :pay-button-disabled="payButtonDisabled"
            :channels="channels"
            :channel-limit="channelLimit"
            :default-index="defaultIndex"
            @select="$emit('select', $event)"
            @pay="$emit('pay', $event)"
          >
            <slot name="channel"></slot>
            <template #button>
              <slot name="payButton"></slot>
            </template>
          </MdCashierChannel>
        </div>

        <!-- 验证码 -->
        <div v-else-if="scene === 'captcha'" :key="sceneKey" class="md-cashier-block md-cashier-captcha">
          <MdCaptcha
            :maxlength="sceneOption.captcha.maxlength"
            :count="sceneOption.captcha.count"
            :count-normal-text="sceneOption.captcha.countNormalText"
            :count-active-text="sceneOption.captcha.countActiveText"
            :auto-countdown="sceneOption.captcha.autoCountdown"
            :brief="sceneOption.captcha.brief"
            is-view
            @send="sceneOption.captcha.onSend"
            @submit="sceneOption.captcha.onSubmit"
          >
            <div v-text="sceneOption.captcha.text"></div>
          </MdCaptcha>
        </div>

        <!-- 加载中 / 成功 -->
        <div
          v-else-if="scene === 'loading' || scene === 'success'"
          :key="sceneKey"
          class="md-cashier-block"
          :class="{
            'md-cashier-loading': scene === 'loading',
            'md-cashier-success': scene === 'success',
          }"
        >
          <div class="md-cashier-block-icon">
            <MdRollerSuccess ref="rolling" :is-success="scene === 'success'"></MdRollerSuccess>
          </div>
          <div class="md-cashier-block-text">
            {{ scene === 'success' ? sceneOption.success.text : sceneOption.loading.text }}
          </div>
          <MdCashierChannelButton
            v-if="scene === 'success'"
            :actions="
              sceneOption.success.actions || [
                {
                  buttonText: sceneOption.success.buttonText,
                  handler: sceneOption.success.handler,
                },
              ]
            "
          />
        </div>

        <!-- 失败 -->
        <div v-else-if="scene === 'fail'" :key="sceneKey" class="md-cashier-block md-cashier-fail">
          <div class="md-cashier-block-icon">
            <MdIcon name="warn-color"></MdIcon>
          </div>
          <div class="md-cashier-block-text" v-text="sceneOption.fail.text"></div>
          <MdCashierChannelButton
            :actions="
              sceneOption.fail.actions || [
                {
                  buttonText: sceneOption.fail.buttonText,
                  handler: sceneOption.fail.handler,
                },
              ]
            "
          />
        </div>

        <!-- 自定义 -->
        <div v-else-if="scene === 'custom'" :key="sceneKey" class="md-cashier-block md-cashier-custom">
          <slot name="scene"></slot>
        </div>

        <slot name="footer" :scene="scene"></slot>
      </div>
    </MdPopup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { t } from '@mand-mobile/core'
import MdPopup from '../popup/Popup.vue'
import MdPopupTitleBar from '../popup/PopupTitleBar.vue'
import MdCaptcha from '../captcha/Captcha.vue'
import MdIcon from '../icon/Icon.vue'
import MdRollerSuccess from '../activity-indicator/RollerSuccess.vue'
import MdCashierChannel, { type CashierChannel } from './CashierChannel.vue'
import MdCashierChannelButton from './CashierChannelButton.vue'

defineOptions({ name: 'md-cashier' })

export type CashierScene = 'choose' | 'captcha' | 'loading' | 'success' | 'fail' | 'custom'

export interface CashierSceneOption {
  loading: { text: string }
  success: { text: string; buttonText: string; handler: (() => void) | null; actions?: never }
  fail: { text: string; buttonText: string; handler: (() => void) | null; actions?: never }
  captcha: {
    text: string
    brief: string
    maxlength: number
    count: number
    autoCountdown: boolean
    countNormalText?: string
    countActiveText?: string
    onSend: () => void
    onSubmit: (code: string) => void
  }
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    channels?: CashierChannel[]
    channelLimit?: number
    defaultIndex?: number
    paymentTitle?: string
    paymentAmount?: string
    paymentDescribe?: string
    payButtonText?: string
    payButtonDisabled?: boolean
    moreButtonText?: string
    title?: string
    describe?: string
    largeRadius?: boolean
  }>(),
  {
    modelValue: false,
    channels: () => [],
    channelLimit: 2,
    defaultIndex: 0,
    paymentTitle: () => t('md.cashier.payCash'),
    paymentAmount: '0.00',
    paymentDescribe: '',
    payButtonText: () => t('md.cashier.confirmPay'),
    payButtonDisabled: false,
    moreButtonText: () => t('md.cashier.morePayWays'),
    title: () => t('md.cashier.pay'),
    describe: '',
    largeRadius: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', item: CashierChannel): void
  (e: 'pay', item: CashierChannel): void
  (e: 'show'): void
  (e: 'hide'): void
  (e: 'cancel'): void
}>()

const isCashierShow = ref(props.modelValue)
const scene = ref<CashierScene>('choose')
const sceneKey = ref(Date.now())
const sceneOption = ref<CashierSceneOption>({
  loading: { text: t('md.cashier.payResultSearch') },
  success: {
    text: t('md.cashier.paySuccess'),
    buttonText: t('md.cashier.confirm'),
    handler: null,
  },
  fail: {
    text: t('md.cashier.payFail'),
    buttonText: t('md.cashier.confirm'),
    handler: null,
  },
  captcha: {
    text: '',
    brief: '',
    maxlength: 4,
    count: 60,
    autoCountdown: true,
    onSend: () => {},
    onSubmit: () => {},
  },
})

watch(
  () => props.modelValue,
  val => {
    isCashierShow.value = val
  },
)
watch(isCashierShow, val => {
  emit('update:modelValue', val)
})

function onPopupHide() {
  resetCashier()
  emit('hide')
}

function onPopupCancel() {
  isCashierShow.value = false
  emit('cancel')
}

function resetCashier() {
  scene.value = 'choose'
}

// MARK: public methods
function next(nextScene: CashierScene, option: Record<string, unknown> = {}) {
  if ((sceneOption.value as unknown as Record<string, unknown>)[nextScene]) {
    const target = (sceneOption.value as unknown as Record<string, unknown>)[nextScene] as Record<string, unknown>
    Object.assign(target, option)
  }
  scene.value = nextScene
  sceneKey.value = Date.now()
}

defineExpose({ next })
</script>
