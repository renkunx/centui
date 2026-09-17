<template>
  <div ref="root" class="md-dialog">
    <MdPopup
      :model-value="modelValue"
      :has-mask="hasMask"
      :mask-closable="maskClosable"
      position="center"
      :transition="transition"
      :prevent-scroll="preventScroll"
      :prevent-scroll-exclude="preventScrollExclude"
      @update:model-value="onInput"
      @show="onShow"
      @hide="onHide"
    >
      <div class="md-dialog-content">
        <slot name="header"></slot>
        <div class="md-dialog-body">
          <a v-if="closable" role="button" class="md-dialog-close" @click="close">
            <MdIcon name="close" />
          </a>
          <div v-if="icon" class="md-dialog-icon">
            <MdIcon :name="icon" :svg="iconSvg" />
          </div>
          <h2 v-if="title" class="md-dialog-title" v-text="title"></h2>
          <slot>
            <div class="md-dialog-text" v-html="content"></div>
          </slot>
        </div>
        <footer class="md-dialog-actions" :class="{ 'is-column': layout === 'column' }">
          <template v-for="(btn, index) in btns" :key="index">
            <a
              role="button"
              class="md-dialog-btn"
              :class="{
                disabled: !!btn.disabled,
                warning: !btn.disabled && !!btn.warning,
              }"
              @click="onClickBtn(btn)"
              @touchmove.prevent
            >
              <MdActivityIndicatorRolling
                v-if="btn.loading"
                class="md-dialog-btn-loading"
              ></MdActivityIndicatorRolling>
              <MdIcon
                v-else-if="btn.icon"
                class="md-dialog-btn-icon"
                :name="btn.icon"
                :svg="btn.iconSvg"
                size="md"
              ></MdIcon>
              {{ btn.text }}
            </a>
          </template>
        </footer>
      </div>
    </MdPopup>
  </div>
</template>

<script lang="ts">
export interface DialogBtn {
  text?: string
  icon?: string
  iconSvg?: boolean
  disabled?: boolean
  warning?: boolean
  loading?: boolean
  handler?: (btn: DialogBtn) => void
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import MdPopup from '../popup/Popup.vue'
import MdIcon from '../icon/Icon.vue'
import MdActivityIndicatorRolling from '../activity-indicator/Roller.vue'

defineOptions({ name: 'md-dialog' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    icon?: string
    iconSvg?: boolean
    closable?: boolean
    content?: string
    btns?: DialogBtn[]
    /** row | column */
    layout?: string
    appendTo?: HTMLElement | null
    hasMask?: boolean
    maskClosable?: boolean
    transition?: string
    preventScroll?: boolean
    preventScrollExclude?: string
  }>(),
  {
    modelValue: false,
    title: '',
    icon: '',
    iconSvg: false,
    closable: true,
    content: '',
    btns: () => [],
    layout: 'row',
    appendTo: undefined,
    hasMask: true,
    maskClosable: false,
    transition: 'md-fade',
    preventScroll: false,
    preventScrollExclude: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'show'): void
  (e: 'hide'): void
}>()

const root = ref<HTMLElement>()
const appendTarget = props.appendTo ?? (typeof document !== 'undefined' ? document.body : null)

onMounted(() => {
  if (appendTarget) {
    appendTarget.appendChild(root.value as HTMLElement)
  }
})

onBeforeUnmount(() => {
  if (appendTarget && root.value && root.value.parentNode === appendTarget) {
    appendTarget.removeChild(root.value)
  }
})

function onInput(val: boolean) {
  emit('update:modelValue', val)
}

function onShow() {
  emit('show')
}

function onHide() {
  emit('hide')
}

function onClickBtn(btn: DialogBtn) {
  if (btn.disabled || btn.loading) {
    return
  }
  if (typeof btn.handler === 'function') {
    btn.handler.call(null, btn)
  } else {
    close()
  }
}

function close() {
  emit('update:modelValue', false)
}

defineExpose({ close })
</script>
