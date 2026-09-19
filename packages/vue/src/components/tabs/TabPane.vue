<template>
  <Transition :name="transitionName">
    <div v-show="active" class="md-tab-pane" role="tabpanel" :tab="name">
      <slot></slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, inject, onBeforeUnmount, watch, type ComponentInternalInstance } from 'vue'

defineOptions({ name: 'md-tab-pane' })

export interface RootTabsLike {
  currentName: unknown
  prevIndex: number
  currentIndex: number
  addPane: (pane: ComponentInternalInstance['proxy']) => void
  removePane: (pane: ComponentInternalInstance['proxy']) => void
  forceUpdate?: () => void
}

const props = withDefaults(
  defineProps<{
    label?: string
    name?: string
    disabled?: boolean
  }>(),
  { label: undefined, name: undefined, disabled: false },
)

const instance = getCurrentInstance()
const proxy = instance?.proxy
const rootTabs = inject<RootTabsLike | null>('rootTabs', null)

const active = computed(() => rootTabs?.currentName === props.name)
const transitionName = computed(() =>
  rootTabs && rootTabs.prevIndex > rootTabs.currentIndex ? 'md-tab-slide-right' : 'md-tab-slide-left',
)

watch(
  () => props.label,
  () => rootTabs?.forceUpdate?.(),
)
watch(
  () => props.disabled,
  () => rootTabs?.forceUpdate?.(),
)

// created 语义：注册到父 Tabs
if (rootTabs && proxy) {
  rootTabs.addPane(proxy)
}
onBeforeUnmount(() => {
  if (rootTabs && proxy) {
    rootTabs.removePane(proxy)
  }
})
</script>
