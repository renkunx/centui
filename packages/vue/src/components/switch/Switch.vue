<template>
  <div
    class="cu-switch"
    :class="[disabled ? 'disabled' : '', modelValue ? 'active' : '']"
    @click="onChange($event)"
  ></div>
</template>

<script setup lang="ts">
defineOptions({ name: 'cu-switch' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    disabled?: boolean
  }>(),
  {
    modelValue: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', event: MouseEvent): void
}>()

function onChange(event: MouseEvent) {
  if (props.disabled) {
    return
  }
  emit('update:modelValue', !props.modelValue)
  emit('change', event)
}
</script>
