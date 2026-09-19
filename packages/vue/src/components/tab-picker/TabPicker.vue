<template>
  <div class="md-tab-picker">
    <MdPopup
      :model-value="modelValue"
      position="bottom"
      :mask-closable="maskClosable"
      @update:model-value="onPopupInput"
      @show="onPopupShow"
      @hide="$emit('hide')"
      @mask-click="onCancel"
    >
      <MdPopupTitleBar
        :title="title"
        :describe="describe"
        :large-radius="largeRadius"
        only-close
        @cancel="onCancel"
      >
        <template #cancel>
          <MdIcon name="close" size="lg" />
        </template>
      </MdPopupTitleBar>
      <div class="md-tab-picker-content">
        <MdTabs ref="tabs" :model-value="currentTab" :key="tabsTmpKey" :ink-length="100">
          <MdScrollView ref="scrollView" :scrolling-x="false" auto-reflow>
            <MdTabPane v-for="(pane, index) in panes" :key="pane.name" :name="pane.name" :label="pane.label">
              <MdRadioList
                :model-value="pane.value"
                :options="pane.options"
                :is-slot-scope="hasSlot"
                icon=""
                icon-inverse=""
                icon-position="right"
                @update:model-value="onSelectPaneItem($event, index)"
              >
                <template v-if="hasSlot" #default="{ option }">
                  <slot :option="option"></slot>
                </template>
              </MdRadioList>
            </MdTabPane>
          </MdScrollView>
        </MdTabs>
      </div>
    </MdPopup>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { t } from '@mand-mobile/core'
import MdPopup from '../popup/Popup.vue'
import MdPopupTitleBar from '../popup/PopupTitleBar.vue'
import MdIcon from '../icon/Icon.vue'
import MdTabs from '../tabs/Tabs.vue'
import MdTabPane from '../tabs/TabPane.vue'
import MdScrollView from '../scroll-view/ScrollView.vue'
import MdRadioList from '../radio-list/RadioList.vue'
import type { RadioListOption } from '../radio-list/RadioList.vue'

defineOptions({ name: 'md-tab-picker' })

export interface TabPickerOption {
  value?: string | number
  label?: string
  children?: TabPickerNode
}

export interface TabPickerNode {
  name?: string
  label?: string
  value?: string | number
  children?: TabPickerNode
  options?: TabPickerOption[]
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    data?: TabPickerNode
    defaultValue?: Array<string | number>
    placeholder?: string
    title?: string
    describe?: string
    maskClosable?: boolean
    largeRadius?: boolean
  }>(),
  {
    modelValue: false,
    data: () => ({}),
    defaultValue: () => [],
    placeholder: () => t('md.tab_picker.choose'),
    title: '',
    describe: '',
    maskClosable: true,
    largeRadius: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', payload: { index: number; value: string | number | boolean | undefined; option: unknown }): void
  (e: 'change', payload: { values: Array<string | number>; options: Array<unknown> }): void
  (e: 'show'): void
  (e: 'hide'): void
}>()

const slots = useSlots()
const tabs = ref<InstanceType<typeof MdTabs> | null>(null)
const scrollView = ref<InstanceType<typeof MdScrollView> | null>(null)

const selected = ref<Array<string | number>>(props.defaultValue.slice())
const oldSelected = ref<Array<string | number>>([])
const currentTab = ref(props.data.name ?? '')
const oldCurrentTab = ref('')
const tabsTmpKey = ref(Date.now())

const hasSlot = computed(() => {
  const fn = slots.default
  if (!fn) {
    return false
  }
  return fn({ option: {} }).some((n) => n.type !== Comment)
})

const panes = computed(() => {
  const result: Array<{
    name?: string
    label?: string
    value: string | number | undefined
    selected: unknown
    options: RadioListOption[]
  }> = []
  let target: TabPickerNode | undefined = props.data
  let cursor = 0
  while (target && target.name) {
    const pane = {
      name: target.name,
      label: target.label || props.placeholder,
      value: selected.value[cursor],
      selected: null as unknown,
      options: (target.options ?? []) as unknown as RadioListOption[],
    }
    let find = false
    const options = (target.options ?? []) as Array<{ value?: string | number; label?: string; children?: TabPickerNode }>
    for (let i = 0, len = options.length; i < len; i++) {
      if (options[i].value === selected.value[cursor]) {
        pane.label = options[i].label as string
        pane.selected = options[i] as unknown as RadioListOption
        target = options[i].children
        find = true
        cursor++
        break
      }
    }
    if (!find) {
      target = undefined
    }
    result.push(pane)
    // v2 契约：pane 推进时同步选中对应 tab
    currentTab.value = pane.name
  }

  return result
})

// created 语义
if (props.data) {
  currentTab.value = props.data.name ?? ''
}

function onPopupInput(val: boolean) {
  emit('update:modelValue', val)
}

function onPopupShow() {
  tabs.value?.reflowTabBar()
  emit('show')
  setTimeout(() => {
    oldSelected.value = selected.value.slice()
    oldCurrentTab.value = currentTab.value
  }, 100)
}

function onCancel() {
  emit('update:modelValue', false)
  setTimeout(() => {
    selected.value = oldSelected.value.slice()
    currentTab.value = oldCurrentTab.value
    tabsTmpKey.value = Date.now()
  }, 100)
}

function onSelectPaneItem(value: string | number | boolean, index: number) {
  selected.value.splice(index, selected.value.length - index, value as string | number)
  // v2 契约：nextTick 后按新 panes 推进 tab / 触发 change
  Promise.resolve().then(() => {
    const nextPane = panes.value[index + 1]

    emit('select', {
      index,
      value,
      option: panes.value[index],
    })

    if (nextPane) {
      currentTab.value = nextPane.name as string
      scrollView.value?.scrollTo(0, 0)
    } else if (value !== '') {
      setTimeout(() => {
        emit('change', {
          values: getSelectedValues(),
          options: getSelectedOptions(),
        })
        emit('update:modelValue', false)
      }, 300)
    }
  })
}

function getSelectedValues() {
  return selected.value.slice()
}

function getSelectedOptions() {
  return panes.value.filter((pane) => pane.value).map((pane) => pane.selected)
}

defineExpose({ getSelectedValues, getSelectedOptions })
</script>
