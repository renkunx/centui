<template>
  <li v-if="noTouch" :class="[active ? 'active' : '']" @click="onFocus($event, 'click')">
    <span v-text="value"></span>
  </li>
  <li
    v-else
    :class="[active ? 'active' : '']"
    @touchstart="onFocus($event, 'touch')"
    @touchmove="onBlur"
    @touchend="onBlur"
    @touchcancel="onBlur"
    @click="onFocus($event, 'click')"
  >
    <span v-text="value"></span>
  </li>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({ name: 'cu-number-key' })

const props = withDefaults(
  defineProps<{
    value?: string | number
    noTouch?: boolean
    noPrevent?: boolean
  }>(),
  {
    value: '',
    noTouch: false,
    noPrevent: false,
  },
)

const emit = defineEmits<{
  (e: 'press', value: string | number): void
}>()

const active = ref(false)
const activeType = ref('')

function onFocus(event: Event & { stopImmediatePropagation: () => void }, type: string) {
  if (!props.noPrevent) {
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  if (activeType.value && activeType.value !== type) {
    return
  }

  activeType.value = type

  if (!props.noTouch) {
    active.value = true
  }

  emit('press', props.value)
}

function onBlur() {
  active.value = false
}
</script>
