<template>
  <div ref="root" class="cu-dialog" role="dialog" aria-modal="true">
    <CuPopup
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
      <div class="cu-dialog-content">
        <slot name="header"></slot>
        <div class="cu-dialog-body">
          <a v-if="closable" role="button" class="cu-dialog-close" @click="close">
            <CuIcon name="close" />
          </a>
          <div v-if="icon" class="cu-dialog-icon">
            <CuIcon :name="icon" :svg="iconSvg" />
          </div>
          <h2 v-if="title" class="cu-dialog-title" v-text="title"></h2>
          <slot>
            <div class="cu-dialog-text" v-html="content"></div>
          </slot>
        </div>
        <footer class="cu-dialog-actions" :class="{ 'is-column': layout === 'column' }">
          <template v-for="(btn, index) in btns" :key="index">
            <a
              role="button"
              class="cu-dialog-btn"
              :class="{
                disabled: !!btn.disabled,
                warning: !btn.disabled && !!btn.warning,
              }"
              @click="onClickBtn(btn)"
              @touchmove.prevent
            >
              <CuActivityIndicatorRolling
                v-if="btn.loading"
                class="cu-dialog-btn-loading"
              ></CuActivityIndicatorRolling>
              <CuIcon
                v-else-if="btn.icon"
                class="cu-dialog-btn-icon"
                :name="btn.icon"
                :svg="btn.iconSvg"
                size="md"
              ></CuIcon>
              {{ btn.text }}
            </a>
          </template>
        </footer>
      </div>
    </CuPopup>
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
import CuPopup from '../popup/Popup.vue'
import CuIcon from '../icon/Icon.vue'
import CuActivityIndicatorRolling from '../activity-indicator/Roller.vue'

defineOptions({ name: 'cu-dialog' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    icon?: string
    iconSvg?: boolean
    closable?: boolean
    /** @warning 内容经 v-html 渲染（v2 兼容行为）：请勿传入不可信来源的字符串，XSS 责任在使用方 */
    content?: string
    btns?: DialogBtn[]
    /** row | column */
    layout?: string
    /**
     * 挂载目标。false 表示不搬运；注意本值在 setup 期一次性求值、运行期不响应变更
     * （v2 同为初始化时决定挂载点）。v3 后续版本计划迁移至 Teleport。
     */
    appendTo?: HTMLElement | null | false
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
    transition: 'cu-fade',
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
const appendTarget = props.appendTo === false
    ? null
    : props.appendTo ?? (typeof document !== 'undefined' ? document.body : null)

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
