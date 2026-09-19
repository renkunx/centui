<template>
  <div class="md-landscape" :class="{ 'is-full': fullScreen }">
    <MdPopup
      v-model="isLandscapeShow"
      :mask-closable="maskClosable"
      prevent-scroll
      prevent-scroll-exclude=".md-landscape-content"
      :has-mask="!fullScreen && hasMask"
      :transition="actualTransition"
      @update:model-value="onPopupInput"
      @show="$emit('show')"
      @hide="$emit('hide')"
    >
      <div class="md-landscape-body" :class="{ scroll }">
        <div class="md-landscape-content">
          <slot></slot>
        </div>
        <MdIcon
          class="md-landscape-close"
          :class="{ dark: !hasMask || fullScreen }"
          :name="fullScreen ? 'clear' : 'close'"
          @click="close"
        />
      </div>
    </MdPopup>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MdPopup from '../popup/Popup.vue'
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-landscape' })

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

// v2 契约：默认过渡按 fullScreen 区分（md-fade / md-punch）
const actualTransition = computed(() => props.transition ?? (props.fullScreen ? 'md-fade' : 'md-punch'))

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
