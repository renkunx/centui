<template>
  <div class="cu-selector" :class="{ 'is-normal': !isCheck, 'is-check': isCheck }">
    <CuPopup
      class="inner-popup"
      v-model="isSelectorShow"
      position="bottom"
      :mask-closable="maskClosable"
      @show="$emit('show')"
      @hide="$emit('hide')"
      @mask-click="onSelectorCancel"
    >
      <CuPopupTitleBar
        v-show="!hideTitleBar || isNeedConfirm"
        :title="title"
        :describe="describe"
        :ok-text="okText"
        :cancel-text="actualCancelText"
        :large-radius="largeRadius"
        :only-close="!isCheck && !isNeedConfirm && !cancelText"
        @confirm="onSelectorConfirm"
        @cancel="onSelectorCancel"
      ></CuPopupTitleBar>
      <div class="cu-selector-container">
        <CuScrollView
          ref="scroll"
          :scrolling-x="false"
          :style="{
            maxHeight: `${maxHeight}`,
            minHeight: `${minHeight}`,
          }"
        >
          <slot name="header"></slot>
          <!-- 单选列表 -->
          <template v-if="!multi">
            <CuRadioList
              class="cu-selector-list"
              ref="radio"
              :key="radioKey"
              :model-value="defaultValue as RadioListOption['value']"
              :options="data"
              :is-slot-scope="hasSlot"
              :icon="icon"
              :icon-disabled="iconDisabled"
              :icon-inverse="iconInverse"
              :icon-position="iconPosition"
              :icon-size="iconSize"
              :icon-svg="iconSvg"
              @change="onSelectorChoose"
            >
              <template v-if="hasSlot" #default="{ option, index, selected }">
                <slot :option="option" :index="index" :selected="selected"></slot>
              </template>
            </CuRadioList>
          </template>
          <!-- 多选列表 -->
          <template v-else>
            <CuCheckList
              class="cu-selector-list"
              ref="check"
              :key="checkKey"
              v-model="multiDefaultValue"
              :options="data"
              :is-slot-scope="hasSlot"
              :icon="icon"
              :icon-disabled="iconDisabled"
              :icon-inverse="iconInverse"
              :icon-position="iconPosition"
              :icon-size="iconSize"
              :icon-svg="iconSvg"
            >
              <template v-if="hasSlot" #default="{ option, index, selected }">
                <slot :option="option" :index="index" :selected="selected"></slot>
              </template>
            </CuCheckList>
          </template>
          <slot name="footer"></slot>
        </CuScrollView>
      </div>
    </CuPopup>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, useSlots } from 'vue'
import { t } from '@centui/core'
import CuPopup from '../popup/Popup.vue'
import CuPopupTitleBar from '../popup/PopupTitleBar.vue'
import CuScrollView from '../scroll-view/ScrollView.vue'
import CuRadioList from '../radio-list/RadioList.vue'
import CuCheckList from '../check/CheckList.vue'
import type { RadioListOption } from '../radio-list/RadioList.vue'

defineOptions({ name: 'cu-selector' })

export type SelectorItem = RadioListOption & { text?: string }

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    data?: SelectorItem[]
    defaultValue?: string | number | boolean | Array<string | number>
    isCheck?: boolean
    maxHeight?: string | number
    minHeight?: string | number
    title?: string
    describe?: string
    okText?: string
    cancelText?: string
    maskClosable?: boolean
    hideTitleBar?: boolean
    multi?: boolean
    icon?: string
    iconInverse?: string
    iconDisabled?: string
    iconSvg?: boolean
    iconSize?: string
    iconPosition?: string
    largeRadius?: boolean
  }>(),
  {
    modelValue: false,
    data: () => [],
    defaultValue: '',
    isCheck: false,
    maxHeight: 'auto',
    minHeight: 'auto',
    title: '',
    describe: '',
    okText: '',
    cancelText: undefined,
    maskClosable: true,
    hideTitleBar: false,
    multi: false,
    icon: 'checked',
    iconInverse: 'check',
    iconDisabled: 'check-disabled',
    iconSvg: false,
    iconSize: 'md',
    iconPosition: 'right',
    largeRadius: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'choose', item: SelectorItem): void
  (e: 'confirm', item: SelectorItem | Array<string | number>): void
  (e: 'cancel'): void
  (e: 'show'): void
  (e: 'hide'): void
}>()

const slots = useSlots()
const radio = ref<InstanceType<typeof CuRadioList> | null>(null)

const isSelectorShow = ref(props.modelValue)
const radioKey = ref(Date.now())
const checkKey = ref(Date.now() + 1)
const activeIndex = ref(-1)
const tmpActiveIndex = ref(-1)
const multiDefaultValue = ref<Array<string | number>>([])

const isNeedConfirm = computed(() => props.okText !== '')
const hasSlot = computed(() => {
  const fn = slots.default
  return !!fn && fn({ option: {}, index: -1, selected: false }).some((n) => n.type !== Comment)
})
const actualCancelText = computed(() => props.cancelText ?? (props.okText ? t('md.selector.cancel') : ''))

watch(
  () => props.modelValue,
  (val) => {
    isSelectorShow.value = val
  },
)
watch(isSelectorShow, (val) => {
  emit('update:modelValue', val)
})
watch(
  () => props.defaultValue,
  (val) => {
    if (!props.multi || val === '') {
      return
    }
    multiDefaultValue.value = !Array.isArray(val) ? [val as string | number] : val
  },
  { immediate: true },
)

function onSelectorConfirm() {
  if (props.multi) {
    emit('confirm', multiDefaultValue.value.slice())
    isSelectorShow.value = false
    return
  }

  if (tmpActiveIndex.value > -1) {
    activeIndex.value = tmpActiveIndex.value
    isSelectorShow.value = false
    emit('confirm', props.data[activeIndex.value])
  }
}

function onSelectorCancel() {
  isSelectorShow.value = false
  tmpActiveIndex.value = activeIndex.value

  if (tmpActiveIndex.value !== -1) {
    radio.value?.selectByIndex(tmpActiveIndex.value)
  } else {
    // 重置单选
    radioKey.value = Date.now()
    checkKey.value = Date.now() + 1
  }

  emit('cancel')
}

function onSelectorChoose(item: RadioListOption, index: number) {
  tmpActiveIndex.value = index
  if (!isNeedConfirm.value) {
    activeIndex.value = index
    isSelectorShow.value = false
  }

  emit('choose', item as SelectorItem)
}
</script>
