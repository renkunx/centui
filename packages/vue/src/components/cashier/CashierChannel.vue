<template>
  <div class="cu-cashier-channel">
    <div class="choose-text">
      <p v-if="paymentTitle" class="choose-title" v-html="paymentTitle"></p>
      <p v-if="paymentAmount" class="choose-number" v-html="paymentAmount"></p>
      <p v-if="paymentDescribe" class="choose-describe" v-html="paymentDescribe"></p>
    </div>
    <div class="choose-channel" :class="{ active: isChannelActive }">
      <slot></slot>
      <div v-if="isChannelShow || isSingle" class="choose-channel-list">
        <CuCashierChannelItem
          v-for="(item, index) in channels"
          :key="index"
          :class="{ default: index === defaultIndex }"
          :data="item as unknown as CashierChannel & Record<string, unknown>"
          :active="index === activeChannelIndex"
          @click="onChannelItemClick(item, index)"
        />
      </div>
      <div v-else-if="channels[defaultIndex]" class="choose-channel-list">
        <CuCashierChannelItem
          class="default"
          :data="channels[defaultIndex] as unknown as CashierChannel & Record<string, unknown>"
          active
          @click="onChannelItemClick(channels[defaultIndex], defaultIndex)"
        />
      </div>
      <div
        v-if="!isSingle"
        class="choose-channel-more"
        :class="{ disabled: isChannelActive }"
        v-html="moreButtonText"
        @click="onChannelMoreClick"
      ></div>
    </div>
    <div class="cu-cashier-block-btn">
      <CuButton
        class="cu-cashier-pay-button"
        :type="payButtonDisabled ? 'disabled' : 'primary'"
        @click="onChannelBtnClick"
      >
        <slot name="button">{{ payButtonText }}</slot>
      </CuButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CuButton from '../button/Button.vue'
import CuCashierChannelItem from './CashierChannelItem.vue'

defineOptions({ name: 'cu-cashier-channel' })

export interface CashierChannel {
  text?: string
  desc?: string
  img?: string
  icon?: string
  value?: string
  disabled?: boolean
  action?: { text: string; handler: () => void }
}

const props = withDefaults(
  defineProps<{
    paymentTitle?: string
    paymentAmount?: string
    paymentDescribe?: string
    moreButtonText?: string
    payButtonText?: string
    payButtonDisabled?: boolean
    channels?: CashierChannel[]
    channelLimit?: number
    defaultIndex?: number
  }>(),
  {
    paymentTitle: '',
    paymentAmount: '',
    paymentDescribe: '',
    moreButtonText: '',
    payButtonText: '',
    payButtonDisabled: false,
    channels: () => [],
    channelLimit: 2,
    defaultIndex: 0,
  },
)

const emit = defineEmits<{
  (e: 'select', item: CashierChannel): void
  (e: 'pay', item: CashierChannel): void
}>()

const isChannelShow = ref(false)
const isChannelActive = ref(false)
const activeChannelIndex = ref(props.defaultIndex)

const isSingle = computed(() => {
  if (props.channelLimit < 1) {
    return true
  }
  return !(props.channels.length > props.channelLimit)
})

function onChannelItemClick(item: CashierChannel, index: number) {
  if (item.disabled) {
    return
  }
  activeChannelIndex.value = index
  emit('select', item)
}

function onChannelMoreClick() {
  if (isChannelActive.value) {
    return
  }
  isChannelShow.value = true
  Promise.resolve().then(() => {
    isChannelActive.value = true
  })
}

function onChannelBtnClick() {
  const item = props.channels[activeChannelIndex.value]
  emit('pay', item)
}
</script>
