<template>
  <div class="cu-toast" :class="[position]">
    <CuPopup
      :model-value="visible"
      :has-mask="hasMask"
      :mask-closable="false"
      @show="onShow"
      @hide="onHide"
    >
      <div v-if="$slots.default" class="cu-toast-content" :class="{ square }">
        <slot></slot>
      </div>
      <div v-else class="cu-toast-content" :class="{ square }">
        <CuIcon v-if="icon" :name="icon" size="lg" :svg="iconSvg" />
        <div v-if="content" class="cu-toast-text" v-text="content"></div>
      </div>
    </CuPopup>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import CuPopup from '../popup/Popup.vue'
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-toast' })

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
