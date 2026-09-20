<template>
  <CuCheckBaseBox
    class="cu-radio-box"
    :label="label"
    :is-checked="isChecked"
    :disabled="disabled"
    :icon-position="iconPosition"
    @click="onClick"
  >
    <slot>{{ label }}</slot>
  </CuCheckBaseBox>
</template>

<script setup lang="ts">
import CuCheckBaseBox from '../check-base/CheckBoxBase.vue'
import { useRadioDelegate } from '../check/shared'

defineOptions({ name: 'cu-radio-box' })

const props = withDefaults(
  defineProps<{
    name?: string | number | boolean
    modelValue?: string | number | boolean
    label?: string
    disabled?: boolean
    /** lt | rt */
    iconPosition?: string
  }>(),
  {
    name: true,
    modelValue: false,
    label: '',
    disabled: false,
    iconPosition: 'rt',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | boolean): void
}>()

const { isChecked, onClick } = useRadioDelegate(props, emit)
</script>
