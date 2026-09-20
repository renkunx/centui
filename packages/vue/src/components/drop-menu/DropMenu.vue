<template>
  <div class="cu-drop-menu">
    <div class="cu-drop-menu-bar">
      <div
        v-for="(item, index) in data"
        :key="index"
        class="bar-item"
        :class="{
          active: index === activeMenuBarIndex,
          selected: checkBarItemSelect(index),
          disabled: item.disabled,
        }"
        @click="onBarItemClick(item, index)"
      >
        <span v-text="getBarItemText(item, index)"></span>
      </div>
    </div>
    <CuPopup
      v-model="isPopupShow"
      position="top"
      prevent-scroll
      :prevent-scroll-exclude="scroller"
      @show="$emit('show')"
      @hide="$emit('hide')"
      @before-hide="activeMenuBarIndex = -1"
    >
      <div class="cu-drop-menu-list">
        <CuRadioList
          :model-value="selectedMenuListValue[activeMenuBarIndex]"
          :options="activeMenuListData"
          :is-slot-scope="hasSlot"
          align-center
          @change="onListItemClick"
        >
          <template v-if="hasSlot" #default="{ option }">
            <slot :option="option"></slot>
          </template>
        </CuRadioList>
      </div>
    </CuPopup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useSlots, watch } from 'vue'
import CuPopup from '../popup/Popup.vue'
import CuRadioList from '../radio-list/RadioList.vue'
import type { RadioListOption } from '../radio-list/RadioList.vue'

defineOptions({ name: 'cu-drop-menu' })

export interface DropMenuItem {
  text?: string
  disabled?: boolean
  options?: Array<{ value?: string | number; text?: string; label?: string }>
}

const props = withDefaults(
  defineProps<{
    data?: DropMenuItem[]
    defaultValue?: Array<string | number>
  }>(),
  { data: () => [], defaultValue: () => [] },
)

const emit = defineEmits<{
  (e: 'change', barItem: DropMenuItem, listItem: unknown): void
  (e: 'show'): void
  (e: 'hide'): void
}>()

const slots = useSlots()
const isPopupShow = ref(false)
const selectedMenuListItem = ref<Array<RadioListOption | undefined>>([])
const selectedMenuListValue = ref<Array<string | number>>([])
const activeMenuBarIndex = ref(-1)
const scroller = ref('')

const hasSlot = computed(() => {
  const fn = slots.default
  if (!fn) {
    return false
  }
  return fn({ option: {} }).some((n) => n.type !== Comment)
})
const activeMenuListData = computed(() => {
  if (activeMenuBarIndex.value < 0 || !props.data[activeMenuBarIndex.value]) {
    return []
  }
  return (props.data[activeMenuBarIndex.value].options ?? []) as unknown as RadioListOption[]
})

watch(
  () => props.data,
  (val, oldVal) => {
    if (JSON.stringify(val) !== JSON.stringify(oldVal)) {
      initSelectedBar()
    }
  },
)
watch(
  () => props.defaultValue,
  (val, oldVal) => {
    if (JSON.stringify(val) !== JSON.stringify(oldVal)) {
      initSelectedBar()
    }
  },
)

onMounted(() => {
  initSelectedBar()
})

// v2 traverse：按层级遍历 options，匹配 defaultValue 定位选中项
function initSelectedBar() {
  selectedMenuListValue.value = props.defaultValue
  const walk = (items: DropMenuItem[] | undefined, level: number, indexs: number[]) => {
    if (!items) {
      return
    }
    items.forEach((item) => {
      const barItemIndex = indexs[0]
      const defaultValue = props.defaultValue[barItemIndex]
      const record = item as unknown as Record<string, unknown>
      if (
        defaultValue !== undefined &&
        (record.value === defaultValue || record.text === defaultValue || record.label === defaultValue)
      ) {
        selectedMenuListItem.value[barItemIndex] = record as unknown as RadioListOption
        return
      }
      if (level > 0) {
        walk((record.options as unknown as DropMenuItem[]) ?? undefined, level, indexs)
      }
    })
  }
  props.data.forEach((barItem, barItemIndex) => {
    walk((barItem.options ?? []) as unknown as DropMenuItem[], 0, [barItemIndex])
  })
}

function checkBarItemSelect(index: number) {
  return !!(selectedMenuListItem.value[index] !== undefined || props.defaultValue[index])
}

function getBarItemText(item: DropMenuItem, index: number) {
  const selected = selectedMenuListItem.value[index]
  return selected !== undefined ? String((selected as { text?: string }).text ?? '') : item.text
}

function onBarItemClick(barItem: DropMenuItem, index: number) {
  if (!barItem || barItem.disabled) {
    return
  }

  if (!isPopupShow.value) {
    isPopupShow.value = true
    activeMenuBarIndex.value = index
  } else {
    isPopupShow.value = false
  }
}

function onListItemClick(listItem: RadioListOption) {
  const index = activeMenuBarIndex.value
  const barItem = props.data[index]
  isPopupShow.value = false
  selectedMenuListValue.value[index] = listItem.value as string | number
  selectedMenuListItem.value[index] = listItem
  emit('change', barItem, listItem)
}

defineExpose({
  getSelectedValues: () => selectedMenuListItem.value,
  getSelectedValue: (index: number) => selectedMenuListItem.value[index],
})
</script>
