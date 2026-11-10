<template>
  <div v-if="isShow" class="cu-notice-bar" :class="[round && 'cu-notice-bar-round', type]">
    <div class="cu-notice-bar-left" :class="[!customLeft && !icon && 'cu-notice-bar-empty']">
      <!-- custom first -->
      <template v-if="customLeft">
        <slot name="left"></slot>
      </template>
      <template v-else-if="icon">
        <CuIcon class="cu-notice-icon" :name="icon" :svg="iconSvg"></CuIcon>
      </template>
    </div>
    <div
      ref="wrap"
      class="cu-notice-bar-content"
      :class="[multiRows && 'cu-notice-bar-multi-content']"
    >
      <div ref="content" :class="[overflow && scrollable && 'cu-notice-bar-content-animate']">
        <slot></slot>
      </div>
    </div>
    <div class="cu-notice-bar-right">
      <!-- custom first -->
      <template v-if="customRight">
        <slot name="right"></slot>
      </template>
      <template v-else-if="mode || closable">
        <CuIcon
          class="cu-notice-icon cu-notice-icon-right"
          :name="rightIcon"
          @click.stop="close"
        ></CuIcon>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-notice-bar' })

const props = withDefaults(
  defineProps<{
    /** link | closable */
    mode?: string
    /** default | activity | warning */
    type?: string
    time?: number
    round?: boolean
    multiRows?: boolean
    scrollable?: boolean
    icon?: string
    iconSvg?: boolean
    closable?: boolean
  }>(),
  {
    mode: '',
    type: 'default',
    time: 0,
    round: false,
    multiRows: false,
    scrollable: false,
    icon: '',
    iconSvg: false,
    closable: false,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const slots = useSlots()
const wrap = ref<HTMLElement>()
const content = ref<HTMLElement>()
const isShow = ref(true)
const overflow = ref(false)

const customLeft = computed(() => !!slots.left)
const customRight = computed(() => !!slots.right)
const rightIcon = computed(() => (props.mode === 'link' ? 'arrow' : 'close'))

/** 自动关闭定时器：卸载/重启时回收 */
let hideTimer: ReturnType<typeof setTimeout> | null = null

function hide(time: number) {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  hideTimer = setTimeout(() => {
    hideTimer = null
    isShow.value = false
  }, time)
}

function close() {
  if (props.mode === 'closable' || props.closable) {
    isShow.value = false
  }
  emit('close')
}

/**
 * 计算 padding-left 对宽度的影响
 * 替换 clientWidth 为 getBoundingClientRect
 */
let lastMeasure = ''

function checkOverflow() {
  if (!props.scrollable) {
    return
  }

  const wrapEl = wrap.value
  const contentEl = content.value
  if (!wrapEl || !contentEl) {
    return
  }

  const paddingLeft =
    window.getComputedStyle(contentEl, null).getPropertyValue('padding').split(' ')[3] || '0px'
  const left = +(paddingLeft.match(/\d+/g) as string[])[0]

  const next =
    contentEl.scrollWidth - left > Math.ceil(wrapEl.getBoundingClientRect().width)
  // 度量未变化时跳过赋值，避免无谓的响应式触发
  const measure = `${contentEl.scrollWidth}|${left}|${next}`
  if (measure === lastMeasure) {
    return
  }
  lastMeasure = measure
  overflow.value = next
}

onMounted(() => {
  if (props.time) {
    hide(props.time)
  }
  checkOverflow()
  if (content.value && typeof MutationObserver !== 'undefined') {
    contentObserver = new MutationObserver(() => checkOverflow())
    contentObserver.observe(content.value, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }
})

onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  contentObserver?.disconnect()
  contentObserver = null
})

// 开关变化时重测溢出（post flush：DOM 更新后同步度量）
watch(
  () => [props.scrollable, props.multiRows],
  () => {
    checkOverflow()
  },
  { flush: 'post' },
)

// 插槽内容变化时重测溢出：以 MutationObserver 取代原先每次组件更新都
// 全量重测的 onUpdated（度量去重后仅在真实变化时写响应式）
let contentObserver: MutationObserver | null = null
</script>
