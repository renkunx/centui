<template>
  <div class="md-tabs">
    <MdTabBar
      ref="tabBar"
      :items="menus"
      :value="currentName"
      :has-ink="hasInk"
      :ink-length="inkLength"
      :immediate="immediate"
      @change="handleTabClick"
      @input="currentName = $event"
    />
    <div class="md-tabs-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue'
import MdTabBar, { type TabBarItem } from './TabBar.vue'
import type { ComponentInternalInstance } from 'vue'

defineOptions({ name: 'md-tabs' })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    hasInk?: boolean
    inkLength?: number
    immediate?: boolean
  }>(),
  { modelValue: undefined, hasInk: true, inkLength: 25, immediate: false },
)

const emit = defineEmits<{
  (e: 'update:modelValue', name: string): void
  (e: 'change', tab: TabBarItem): void
}>()

const tabBar = ref<InstanceType<typeof MdTabBar> | null>(null)
const currentName = ref<string | number | undefined>(props.modelValue)
const prevIndex = ref(0)
const panes = ref<Array<ComponentInternalInstance['proxy']>>([])

const menus = computed(() =>
  panes.value.map(pane => ({
    name: (pane as { name?: string }).name as string,
    label: (pane as { label?: string }).label as string,
    disabled: (pane as { disabled?: boolean }).disabled as boolean,
  })),
)
const currentIndex = computed(() => {
  for (let i = 0, len = menus.value.length; i < len; i++) {
    if (menus.value[i].name === currentName.value) {
      return i
    }
  }
  return 0
})

provide('rootTabs', {
  get currentName() {
    return currentName.value
  },
  get prevIndex() {
    return prevIndex.value
  },
  get currentIndex() {
    return currentIndex.value
  },
  addPane(pane: ComponentInternalInstance['proxy']) {
    if (panes.value.indexOf(pane) === -1) {
      panes.value.push(pane)
    }
  },
  removePane(pane: ComponentInternalInstance['proxy']) {
    const index = panes.value.indexOf(pane)
    if (index >= 0) {
      panes.value.splice(index, 1)
    }
  },
  forceUpdate() {
    // label/disabled 变化触发响应式更新（v2 $forceUpdate 等价）
    panes.value = [...panes.value]
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (val !== currentName.value) {
      currentName.value = val
    }
  },
)

onMounted(() => {
  if (!currentName.value && menus.value.length) {
    currentName.value = menus.value[0].name
  }
})

function handleTabClick(tab: TabBarItem, _index: number, prev: number) {
  currentName.value = tab.name as string
  prevIndex.value = prev
  emit('update:modelValue', tab.name as string)
  emit('change', tab)
}

function reflowTabBar() {
  tabBar.value?.reflow()
}

defineExpose({ reflowTabBar })
</script>
