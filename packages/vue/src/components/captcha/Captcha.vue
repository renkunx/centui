<template>
  <div v-show="isInline || modelValue || visible" class="md-captcha">
    <!-- 内联模式 -->
    <template v-if="isInline">
      <div class="md-captcha-content">
        <h2 v-if="title" class="md-captcha-title" v-text="title"></h2>
        <div class="md-captcha-message">
          <slot></slot>
        </div>
      </div>
      <MdCodebox
        ref="codebox"
        v-model="code"
        :maxlength="maxlength"
        :system="system"
        :mask="mask"
        :closable="false"
        :is-view="true"
        :justify="true"
        :autofocus="false"
        :input-type="inputType"
        @submit="onSubmit"
      >
        <footer class="md-captcha-footer">
          <div v-if="errorMsg" class="md-captcha-error" v-text="errorMsg"></div>
          <div v-else class="md-captcha-brief" v-text="brief"></div>
          <button
            v-if="count"
            class="md-captcha-btn"
            v-text="countBtnText"
            :disabled="isCounting"
            @click="onResend"
          ></button>
        </footer>
      </MdCodebox>
    </template>
    <!-- 半屏弹层模式 -->
    <template v-if="type === 'halfScreen'">
      <MdPopup
        :model-value="modelValue"
        :has-mask="true"
        position="bottom"
        :mask-closable="false"
        @update:model-value="onPopupInput"
        @show="onShow"
        @hide="onHide"
      >
        <div class="md-captcha-half-container">
          <MdPopupTitleBar
            only-close
            large-radius
            :title="title"
            :describe="subtitle"
            title-align="left"
            @cancel="close"
          ></MdPopupTitleBar>
          <div class="md-captcha-half-content">
            <slot></slot>
          </div>
          <MdCodebox
            ref="codebox"
            v-model="code"
            :maxlength="maxlength"
            :system="system"
            :mask="mask"
            :disabled="disableSend"
            :closable="false"
            :is-view="true"
            :justify="true"
            :autofocus="false"
            :input-type="inputType"
            :is-error-style="isShowErrorStyle"
            @submit="onSubmit"
          >
            <footer class="md-captcha-footer" :class="{ halfStyle: isKeyboard }">
              <div v-if="errorMsg" class="md-captcha-error" v-text="errorMsg"></div>
              <div v-else class="md-captcha-brief" v-text="brief"></div>
              <button
                v-if="count"
                class="md-captcha-btn"
                :class="[disableSend && 'is-disabled-send']"
                v-text="countBtnText"
                :disabled="isCounting"
                @click="onResend"
              ></button>
            </footer>
          </MdCodebox>
        </div>
      </MdPopup>
    </template>
    <!-- 对话框模式 -->
    <template v-if="type === 'dialog'">
      <MdDialog
        :model-value="modelValue"
        :closable="true"
        :append-to="false"
        position="center"
        @update:model-value="onPopupInput"
        @show="onShow"
        @hide="onHide"
      >
        <div class="md-captcha-content">
          <h2 v-if="title" class="md-captcha-title" v-text="title"></h2>
          <div class="md-captcha-message">
            <slot></slot>
          </div>
        </div>
        <MdCodebox
          ref="codebox"
          v-model="code"
          :maxlength="maxlength"
          :system="system"
          :closable="false"
          :mask="mask"
          :justify="true"
          :autofocus="false"
          :input-type="inputType"
          @submit="onSubmit"
        >
          <footer class="md-captcha-footer">
            <div v-if="errorMsg" class="md-captcha-error" v-text="errorMsg"></div>
            <div v-else class="md-captcha-brief" v-text="brief"></div>
            <button
              v-if="count"
              class="md-captcha-btn"
              v-text="countBtnText"
              :disabled="isCounting"
              @click="onResend"
            ></button>
          </footer>
        </MdCodebox>
      </MdDialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { t } from '@mand-mobile/core'
import MdPopup from '../popup/Popup.vue'
import MdPopupTitleBar from '../popup/PopupTitleBar.vue'
import MdDialog from '../dialog/Dialog.vue'
import MdCodebox from '../codebox/Codebox.vue'

defineOptions({ name: 'md-captcha' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    subtitle?: string
    brief?: string
    maxlength?: number | string
    mask?: boolean
    system?: boolean
    autoSend?: boolean
    autoCountdown?: boolean
    count?: number
    countNormalText?: string
    countActiveText?: string
    isView?: boolean
    /** inline | halfScreen | dialog */
    type?: string
    inputType?: string
    disableSend?: boolean
  }>(),
  {
    modelValue: false,
    title: undefined,
    subtitle: undefined,
    brief: '',
    maxlength: 4,
    mask: false,
    system: false,
    autoSend: true,
    autoCountdown: true,
    count: 60,
    countNormalText: () => t('md.captcha.sendCaptcha'),
    countActiveText: () => t('md.captcha.countdown'),
    isView: false,
    type: 'dialog',
    inputType: 'tel',
    disableSend: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'show'): void
  (e: 'hide'): void
  (e: 'submit', code: string): void
  (e: 'send', countdown: () => void): void
}>()

const codebox = ref<InstanceType<typeof MdCodebox> | null>(null)
const code = ref('')
const visible = ref(false)
const errorMsg = ref('')
const isCounting = ref(false)
const firstShown = ref(false)
const countBtnText = ref(props.countNormalText)
const isKeyboard = ref(false)
const originHeight = ref(0)

const isInline = computed(() => props.isView || props.type === 'inline')
const isShowErrorStyle = computed(() => errorMsg.value !== '' && !props.disableSend)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      code.value = ''
      if (!firstShown.value) {
        firstShown.value = true
        emitSend()
      }
    }
  },
)
watch(code, (val) => {
  if (val && errorMsg.value) {
    errorMsg.value = ''
  }
})

onMounted(() => {
  if (isAndroidDevice() && props.type === 'halfScreen') {
    originHeight.value = document.documentElement.clientHeight || document.body.clientHeight
    window.addEventListener('resize', listenResize, false)
  }
  if (props.modelValue || isInline.value) {
    firstShown.value = true
    emitSend()
  }
})

onBeforeUnmount(() => {
  if (isAndroidDevice() && props.type === 'halfScreen') {
    window.removeEventListener('resize', listenResize)
  }
})

function isAndroidDevice() {
  const ua = window.navigator.userAgent.toLocaleLowerCase()
  return /android/.test(ua)
}

function listenResize() {
  const resizeHeight = document.documentElement.clientHeight || document.body.clientHeight
  if (originHeight.value < resizeHeight) {
    isKeyboard.value = false
  } else {
    isKeyboard.value = true
  }
  originHeight.value = resizeHeight
}

function onPopupInput(val: boolean) {
  emit('update:modelValue', val)
}

function onShow() {
  visible.value = true
  codebox.value?.focus()
  emit('show')
}

function onHide() {
  visible.value = false
  codebox.value?.blur()
  emit('hide')
}

function onSubmit(codeText: string) {
  emit('submit', codeText)
}

function onResend() {
  if (props.autoCountdown) {
    countdown()
  }
  emit('send', countdown)
}

function emitSend() {
  if (props.autoSend) {
    onResend()
  }
}

let counter: ReturnType<typeof setInterval> | null = null

// MARK: public methods
function countdown() {
  if (!props.count) {
    return
  }
  if (counter) {
    clearInterval(counter)
  }
  const timestamp = Date.now()
  let i = props.count
  isCounting.value = true
  countBtnText.value = props.countActiveText.replace('{$1}', String(i))
  counter = setInterval(() => {
    if (i <= 1) {
      resetcount()
    } else {
      i = props.count - Math.floor((Date.now() - timestamp) / 1000)
      countBtnText.value = props.countActiveText.replace('{$1}', String(i))
    }
  }, 1000)
}

function resetcount() {
  isCounting.value = false
  countBtnText.value = props.countNormalText
  if (counter) {
    clearInterval(counter)
  }
}

function setError(msg: string) {
  Promise.resolve().then(() => {
    errorMsg.value = msg
  })
}

function close() {
  emit('update:modelValue', false)
}

defineExpose({ countdown, resetcount, setError, close, listenResize })
</script>
