<template>
  <label
    class="cu-radio"
    :class="{
      'is-disabled': disabled,
      'is-checked': isChecked,
      'is-inline': inline,
    }"
    @click="onClick"
  >
    <div class="cu-radio-icon">
      <CuIcon :name="currentIcon" :size="size" :svg="iconSvg" />
    </div>
    <div v-if="$slots.default || label" class="cu-radio-label">
      <slot>{{ label }}</slot>
    </div>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CuIcon from '../icon/Icon.vue'
import { useRadioDelegate } from '../check/shared'

defineOptions({ name: 'cu-radio' })

const props = withDefaults(
  defineProps<{
    name: string | number | boolean
    modelValue?: string | number | boolean
    size?: string
    label?: string
    inline?: boolean
    disabled?: boolean
    icon?: string
    iconInverse?: string
    iconDisabled?: string
    iconSvg?: boolean
  }>(),
  {
    modelValue: '',
    size: 'md',
    label: '',
    inline: false,
    disabled: false,
    icon: 'checked',
    iconInverse: 'check',
    iconDisabled: 'check-disabled',
    iconSvg: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | boolean): void
}>()

const { isChecked, onClick } = useRadioDelegate(props, emit)

const currentIcon = computed(() =>
  props.disabled ? props.iconDisabled : isChecked.value ? props.icon : props.iconInverse,
)
</script>
