<template>
  <div
    class="md-popup-title-bar"
    :class="[
      `title-align-${titleAlign}`,
      {
        large: !!describe,
        'large-radius': largeRadius,
      },
    ]"
    @touchmove="preventScroll"
  >
    <!-- Cancel -->
    <template v-if="!onlyClose">
      <div
        v-if="cancelText"
        class="title-bar-left md-popup-cancel"
        v-html="cancelText"
        @click="emit('cancel')"
      ></div>
      <div v-else-if="$slots.cancel" class="title-bar-left md-popup-cancel" @click="emit('cancel')">
        <slot name="cancel"></slot>
      </div>
    </template>

    <!-- Title -->
    <div v-if="title" class="title-bar-title">
      <p v-if="title" class="title" v-html="title"></p>
      <p v-if="describe" class="describe" v-html="describe"></p>
    </div>
    <div v-else class="title-bar-title">
      <slot name="title"></slot>
    </div>

    <!-- Ok -->
    <template v-if="!onlyClose">
      <div
        v-if="okText"
        class="title-bar-right md-popup-confirm"
        v-html="okText"
        @click="emit('confirm')"
      ></div>
      <div
        v-else-if="$slots.confirm"
        class="title-bar-right md-popup-confirm"
        @click="emit('confirm')"
      >
        <slot name="confirm"></slot>
      </div>
    </template>
    <template v-if="onlyClose">
      <div class="title-bar-right md-popup-close" @click="emit('cancel')">
        <MdIcon name="close" size="lg"></MdIcon>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { inject, watch, type Ref } from 'vue'
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-popup-title-bar' })

const props = withDefaults(
  defineProps<{
    title?: string
    describe?: string
    okText?: string
    cancelText?: string
    largeRadius?: boolean
    onlyClose?: boolean
    /** center | left | right */
    titleAlign?: string
  }>(),
  {
    title: '',
    describe: '',
    okText: '',
    cancelText: '',
    largeRadius: false,
    onlyClose: false,
    titleAlign: 'center',
  },
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

// v2 契约：title-bar 的 largeRadius 会同步到父级 Popup 的 large-radius 修饰类
const popupLargeRadius = inject<Ref<boolean> | null>('mdPopupLargeRadius', null)

watch(
  () => props.largeRadius,
  (val) => {
    if (popupLargeRadius) {
      popupLargeRadius.value = val
    }
  },
  { immediate: true },
)

function preventScroll(e: TouchEvent) {
  e.preventDefault()
}
</script>
