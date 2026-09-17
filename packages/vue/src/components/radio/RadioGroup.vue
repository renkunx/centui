<template>
  <div class="md-radio-group">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { type RadioRootGroup } from '../check/shared'

defineOptions({ name: 'md-radio-group' })

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean
    max?: number
  }>(),
  {
    modelValue: '',
    max: 0,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | boolean): void
}>()

const rootGroup: RadioRootGroup = {
  get value() {
    return props.modelValue
  },
  check(name) {
    emit('update:modelValue', name)
  },
}

provide('rootGroup', rootGroup)
</script>
