<template>
  <label
    class="md-check"
    :class="{
      'is-disabled': disabled,
      'is-checked': isChecked,
    }"
    @click="onClick"
  >
    <div class="md-check-icon">
      <MdIcon :name="currentIcon" :size="size" :svg="iconSvg" />
    </div>
    <div v-if="$slots.default || label" class="md-check-label">
      <slot>{{ label }}</slot>
    </div>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MdIcon from '../icon/Icon.vue'
import { useCheckDelegate } from './shared'

defineOptions({ name: 'md-check' })

const props = withDefaults(
  defineProps<{
    name?: string | number | boolean
    modelValue?: string | number | boolean
    size?: string
    label?: string
    disabled?: boolean
    icon?: string
    iconInverse?: string
    iconDisabled?: string
    iconSvg?: boolean
  }>(),
  {
    name: true,
    modelValue: false,
    size: 'md',
    label: '',
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

const { isChecked, onClick } = useCheckDelegate(props, emit)

const currentIcon = computed(() =>
  props.disabled ? props.iconDisabled : isChecked.value ? props.icon : props.iconInverse,
)
</script>
