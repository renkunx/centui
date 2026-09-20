<template>
  <div class="cu-landscape" :class="{ 'is-full': fullScreen }">
    <CuPopup
      v-model="isLandscapeShow"
      :mask-closable="maskClosable"
      prevent-scroll
      prevent-scroll-exclude=".cu-landscape-content"
      :has-mask="!fullScreen && hasMask"
      :transition="actualTransition"
      @update:model-value="onPopupInput"
      @show="$emit('show')"
      @hide="$emit('hide')"
    >
      <div class="cu-landscape-body" :class="{ scroll }">
        <div class="cu-landscape-content">
          <slot></slot>
        </div>
        <CuIcon
          class="cu-landscape-close"
          :class="{ dark: !hasMask || fullScreen }"
          :name="fullScreen ? 'clear' : 'close'"
          @click="close"
        />
      </div>
    </CuPopup>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CuPopup from '../popup/Popup.vue'
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-landscape' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    scroll?: boolean
    fullScreen?: boolean
    hasMask?: boolean
    maskClosable?: boolean
    transition?: string
  }>(),
  {
    modelValue: false,
    scroll: false,
    fullScreen: false,
    hasMask: true,
    maskClosable: false,
    transition: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'input', value: boolean): void
  (e: 'show'): void
  (e: 'hide'): void
}>()

const isLandscapeShow = ref(props.modelValue)

// v2 契约：默认过渡按 fullScreen 区分（cu-fade / cu-punch）
const actualTransition = computed(() => props.transition ?? (props.fullScreen ? 'cu-fade' : 'cu-punch'))

watch(
  () => props.modelValue,
  (val) => {
    isLandscapeShow.value = val
  },
)

function onPopupInput(val: boolean) {
  isLandscapeShow.value = val
  emit('update:modelValue', false)
  emit('input', false)
}

function close() {
  isLandscapeShow.value = false
}
</script>
