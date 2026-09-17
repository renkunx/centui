<template>
  <div class="md-toast" :class="[position]">
    <MdPopup
      :model-value="visible"
      :has-mask="hasMask"
      :mask-closable="false"
      @show="onShow"
      @hide="onHide"
    >
      <div v-if="$slots.default" class="md-toast-content" :class="{ square }">
        <slot></slot>
      </div>
      <div v-else class="md-toast-content" :class="{ square }">
        <MdIcon v-if="icon" :name="icon" size="lg" :svg="iconSvg" />
        <div v-if="content" class="md-toast-text" v-text="content"></div>
      </div>
    </MdPopup>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import MdPopup from '../popup/Popup.vue'
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-toast' })

const props = withDefaults(
  defineProps<{
    icon?: string
    iconSvg?: boolean
    content?: string | number
    duration?: number
    /** top | center | bottom */
    position?: string
    hasMask?: boolean
    square?: boolean
  }>(),
  {
    icon: '',
    iconSvg: false,
    content: '',
    duration: 0,
    position: 'center',
    hasMask: false,
    square: false,
  },
)

const emit = defineEmits<{
  (e: 'show'): void
  (e: 'hide'): void
}>()

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

function onShow() {
  emit('show')
}

function onHide() {
  emit('hide')
}

function fire() {
  if (timer) {
    clearTimeout(timer)
  }
  if (visible.value && props.duration) {
    timer = setTimeout(() => {
      hide()
    }, props.duration)
  }
}

function show() {
  visible.value = true
  fire()
}

function hide() {
  visible.value = false
}

defineExpose({ visible, show, hide, fire })
</script>
