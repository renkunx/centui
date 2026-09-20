<template>
  <div
    v-show="isPopupShow"
    ref="root"
    class="cu-popup"
    :class="[hasMask ? 'with-mask' : '', largeRadius ? 'large-radius' : '', position]"
  >
    <transition name="cu-mask-fade">
      <div v-show="hasMask && isPopupBoxShow" class="cu-popup-mask" @click="onPopupMaskClick"></div>
    </transition>
    <transition
      :name="transitionName"
      @before-enter="onPopupTransitionStart"
      @before-leave="onPopupTransitionStart"
      @after-enter="onPopupTransitionEnd"
      @after-leave="onPopupTransitionEnd"
    >
      <div v-show="isPopupBoxShow" class="cu-popup-box" :class="[transitionName]">
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, watch, type Ref } from 'vue'

defineOptions({ name: 'cu-popup' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    hasMask?: boolean
    maskClosable?: boolean
    /** center | top | bottom | left | right */
    position?: string
    /** 覆盖默认过渡名（cu-fade / cu-slide-up / ...，样式由 @centui/styles 提供） */
    transition?: string
    preventScroll?: boolean
    preventScrollExclude?: string | HTMLElement
  }>(),
  {
    modelValue: false,
    hasMask: true,
    maskClosable: true,
    position: 'center',
    transition: undefined,
    preventScroll: false,
    preventScrollExclude: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'beforeShow'): void
  (e: 'before-show'): void
  (e: 'beforeHide'): void
  (e: 'before-hide'): void
  (e: 'show'): void
  (e: 'hide'): void
  (e: 'maskClick'): void
}>()

const isTestEnv = typeof process !== 'undefined' && process.env.MAND_ENV === 'test'

const root = ref<HTMLElement>()

// controle popup mask & popup box
const isPopupShow = ref(false)
// controle popup box
const isPopupBoxShow = ref(false)
// transition lock
const isAnimation = ref(false)
const largeRadius = ref(false)

provide('mdPopupLargeRadius', largeRadius as Ref<boolean>)

const transitionName = computed(() => props.transition ?? defaultTransition(props.position))

function defaultTransition(position: string): string {
  switch (position) {
    case 'bottom':
      return 'cu-slide-up'
    case 'top':
      return 'cu-slide-down'
    case 'left':
      return 'cu-slide-right'
    case 'right':
      return 'cu-slide-left'
    default:
      return 'cu-fade'
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (isAnimation.value) {
        setTimeout(() => {
          showPopupBox()
        }, 50)
      } else {
        showPopupBox()
      }
    } else {
      hidePopupBox()
    }
  },
)

watch(
  () => props.preventScrollExclude,
  (val, oldVal) => {
    // remove old listener before add
    preventScrollExcludeBind(false, oldVal)
    preventScrollExcludeBind(true, val)
  },
)

onMounted(() => {
  props.modelValue && showPopupBox()
})

function showPopupBox() {
  isPopupShow.value = true
  isAnimation.value = true
  // popup box enter the animation after popup show
  isPopupBoxShow.value = true
  if (isTestEnv) {
    onPopupTransitionStart()
    onPopupTransitionEnd()
  }

  props.preventScroll && preventScroll(true)
}

function hidePopupBox() {
  isAnimation.value = true
  isPopupBoxShow.value = false
  props.preventScroll && preventScroll(false)
  emit('update:modelValue', false)
  if (isTestEnv) {
    onPopupTransitionStart()
    onPopupTransitionEnd()
  }
}

function preventScroll(isBind: boolean) {
  const handler = isBind ? 'addEventListener' : 'removeEventListener'
  const masker = root.value?.querySelector<HTMLElement>('.cu-popup-mask')
  const boxer = root.value?.querySelector<HTMLElement>('.cu-popup-box')

  masker && masker[handler]('touchmove', preventDefault, false)
  boxer && boxer[handler]('touchmove', preventDefault, false)
  preventScrollExcludeBind(isBind)
}

function preventScrollExcludeBind(
  isBind: boolean,
  exclude: string | HTMLElement | undefined = props.preventScrollExclude,
) {
  const handler = isBind ? 'addEventListener' : 'removeEventListener'
  const excluder: HTMLElement | undefined | null =
    typeof exclude === 'string'
      ? exclude
        ? root.value?.querySelector<HTMLElement>(exclude)
        : undefined
      : exclude
  if (excluder) {
    excluder[handler]('touchmove', stopImmediatePropagation, false)
  }
}

function preventDefault(event: Event) {
  event.preventDefault()
}

function stopImmediatePropagation(event: Event) {
  event.stopImmediatePropagation()
}

function onPopupTransitionStart() {
  if (!isPopupBoxShow.value) {
    emit('beforeHide')
    emit('before-hide')
  } else {
    emit('beforeShow')
    emit('before-show')
  }
}

function onPopupTransitionEnd() {
  if (!isAnimation.value) {
    return
  }

  if (!isPopupBoxShow.value) {
    // popup hide after popup box finish animation
    isPopupShow.value = false
    emit('hide')
  } else {
    emit('show')
  }

  isAnimation.value = false
}

function onPopupMaskClick() {
  if (props.maskClosable) {
    hidePopupBox()
    emit('maskClick')
  }
}
</script>
