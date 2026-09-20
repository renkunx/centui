<template>
  <nav class="cu-tab-bar">
    <div ref="wrapper" class="cu-tab-bar-inner">
      <template v-if="scrollable">
        <div v-show="maskStartShown" class="cu-tab-bar-start"></div>
        <div v-show="maskEndShown" class="cu-tab-bar-end"></div>
      </template>
      <CuScrollView ref="scroller" :scrolling-x="scrollable" :scrolling-y="false" :key="scrollerTmpKey" @scroll="onScroll">
        <div class="cu-tab-bar-list" :style="{ width: contentW + 'px' }">
          <a
            v-for="(item, index) in items"
            :key="item.name"
            :ref="el => setItemRef(el, index)"
            class="cu-tab-bar-item"
            :class="{
              'is-active': currentName === item.name,
              'is-disabled': !!item.disabled,
              'more-than-five': items.length > 5 && index === 0,
            }"
            @click="onClick(item, index)"
          >
            <slot
              name="item"
              :item="item"
              :items="items"
              :index="index"
              :current-name="currentName"
            >{{ item.label }}</slot>
          </a>
        </div>
        <span
          v-if="hasInk"
          class="cu-tab-bar-ink"
          :class="{
            'is-disabled': currentTab && currentTab.disabled,
          }"
          :style="{
            width: inkWidth + 'px',
            transform: 'translateX(' + inkPos + 'px)',
          }"
        ></span>
      </CuScrollView>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import CuScrollView from '../scroll-view/ScrollView.vue'

defineOptions({ name: 'cu-tab-bar' })

export interface TabBarItem {
  name: string | number
  label?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    value?: string | number
    items?: TabBarItem[]
    hasInk?: boolean
    inkLength?: number | string
    immediate?: boolean
  }>(),
  { value: '', items: () => [], hasInk: true, inkLength: '25', immediate: false },
)

const emit = defineEmits<{
  (e: 'change', item: TabBarItem, index: number, prevIndex: number): void
  (e: 'update:modelValue' | 'input', name: string | number): void
}>()

const currentName = ref<string | number>('')
const wrapperW = ref(0)
const contentW = ref(0)
const inkWidth = ref(0)
const inkPos = ref(0)
const scrollerTmpKey = ref(Date.now())
const maskStartShown = ref(false)
const maskEndShown = ref(true)

const wrapper = ref<HTMLElement>()
const scroller = ref<InstanceType<typeof CuScrollView> | null>(null)
const itemRefs: HTMLElement[] = []
function setItemRef(el: unknown, index: number) {
  if (el) {
    itemRefs[index] = el as HTMLElement
  }
}

const scrollable = computed(() => contentW.value > wrapperW.value)
const currentIndex = computed(() => {
  for (let i = 0, len = props.items.length; i < len; i++) {
    if (props.items[i].name === currentName.value) {
      return i
    }
  }
  return -1
})
// v2 契约：if (this.currentIndex) 真值判断（index 0 时 currentTab 为 undefined）
const currentTab = computed(() => {
  if (currentIndex.value) {
    return props.items[currentIndex.value]
  }
  return undefined
})

watch(
  () => props.value,
  (val) => {
    if (val !== currentName.value) {
      currentName.value = val
    }
  },
  { immediate: true },
)
watch(inkWidth, () => {
  nextTick(() => reflow())
})
watch(
  () => props.items,
  () => {
    nextTick(() => reflow())
  },
)
watch(currentIndex, () => {
  nextTick(() => reflow())
})
watch(scrollable, () => {
  scrollerTmpKey.value = Date.now()
})

// created 语义：默认选中首项
if (currentName.value === '' && props.items.length) {
  currentName.value = props.items[0].name
  emit('change', props.items[0], 0, 0)
}

onMounted(() => {
  resizeEnterBehavior()
})
onActivated(() => {
  resizeEnterBehavior()
})
onDeactivated(() => {
  resizeLeaveBehavior()
})
onBeforeUnmount(() => {
  resizeLeaveBehavior()
})

function onScroll({ scrollLeft: left }: { scrollLeft: number; scrollTop: number }) {
  if (left > 0) {
    maskStartShown.value = true
  } else {
    maskStartShown.value = false
  }
  maskEndShown.value = !(contentW.value > 0 && left >= contentW.value - wrapperW.value)
}

function onClick(item: TabBarItem, index: number) {
  if (item.disabled) {
    return
  }
  emit('change', item, index, currentIndex.value)
  currentName.value = item.name
  emit('update:modelValue', item.name)
}

function resizeEnterBehavior() {
  window.addEventListener('resize', reflow)
  reflow()
  if (props.immediate) {
    nextTick(() => {
      const item = props.items[currentIndex.value]
      if (item) {
        emit('change', item, currentIndex.value, currentIndex.value)
      }
    })
  }
}

function resizeLeaveBehavior() {
  window.removeEventListener('resize', reflow)
}

// MARK: public methods
function reflow() {
  if (!itemRefs.length) {
    return
  }

  const wrapperRect = wrapper.value?.getBoundingClientRect()
  wrapperW.value = wrapperRect?.width ?? 0

  let contentWidth = 0
  for (let i = 0, len = props.items.length; i < len; i++) {
    const rect = itemRefs[i]?.getBoundingClientRect()
    contentWidth += rect?.width ?? 0
  }
  contentW.value = contentWidth
  scroller.value?.reflowScroller()
  nextTick(() => {
    const target = itemRefs[currentIndex.value]
    if (!target) {
      return
    }
    inkWidth.value = typeof props.inkLength === 'string' ? Number(props.inkLength) : (target.offsetWidth * props.inkLength) / 100
    inkPos.value = target.offsetLeft + (target.offsetWidth - inkWidth.value) / 2

    const prevTarget = itemRefs[currentIndex.value - 1]
    const nextTarget = itemRefs[currentIndex.value + 1]

    if (!prevTarget) {
      scroller.value?.scrollTo(0, 0, true)
      return
    }
    if (!nextTarget) {
      scroller.value?.scrollTo(contentW.value, 0, true)
      return
    }

    const wrapperRect2 = wrapper.value?.getBoundingClientRect()
    const prevRect = prevTarget.getBoundingClientRect()
    const nextRect = nextTarget.getBoundingClientRect()
    if (wrapperRect2 && prevRect.left < wrapperRect2.left) {
      scroller.value?.scrollTo(prevTarget.offsetLeft, 0, true)
    } else if (wrapperRect2 && nextRect.right > wrapperRect2.right) {
      scroller.value?.scrollTo(nextTarget.offsetLeft + nextTarget.offsetWidth - wrapperW.value, 0, true)
    }
  })
}

defineExpose({ reflow })
</script>
