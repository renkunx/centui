<template>
  <div v-if="isShow" class="md-notice-bar" :class="[round && 'md-notice-bar-round', type]">
    <div class="md-notice-bar-left" :class="[!customLeft && !icon && 'md-notice-bar-empty']">
      <!-- custom first -->
      <template v-if="customLeft">
        <slot name="left"></slot>
      </template>
      <template v-else-if="icon">
        <MdIcon class="md-notice-icon" :name="icon" :svg="iconSvg"></MdIcon>
      </template>
    </div>
    <div
      ref="wrap"
      class="md-notice-bar-content"
      :class="[multiRows && 'md-notice-bar-multi-content']"
    >
      <div ref="content" :class="[overflow && scrollable && 'md-notice-bar-content-animate']">
        <slot></slot>
      </div>
    </div>
    <div class="md-notice-bar-right">
      <!-- custom first -->
      <template v-if="customRight">
        <slot name="right"></slot>
      </template>
      <template v-else-if="mode || closable">
        <MdIcon
          class="md-notice-icon md-notice-icon-right"
          :name="rightIcon"
          @click.stop="close"
        ></MdIcon>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUpdated, ref, useSlots } from 'vue'
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-notice-bar' })

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

function hide(time: number) {
  setTimeout(() => {
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

  overflow.value = contentEl.scrollWidth - left > Math.ceil(wrapEl.getBoundingClientRect().width)
}

onMounted(() => {
  if (props.time) {
    hide(props.time)
  }
  checkOverflow()
})

onUpdated(() => {
  checkOverflow()
})
</script>
