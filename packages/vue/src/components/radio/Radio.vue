<template>
  <label
    class="md-radio"
    :class="{
      'is-disabled': disabled,
      'is-checked': isChecked,
      'is-inline': inline,
    }"
    @click="onClick"
  >
    <div class="md-radio-icon">
      <MdIcon :name="currentIcon" :size="size" :svg="iconSvg" />
    </div>
    <div v-if="$slots.default || label" class="md-radio-label">
      <slot>{{ label }}</slot>
    </div>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MdIcon from '../icon/Icon.vue'
import { useRadioDelegate } from '../check/shared'

defineOptions({ name: 'md-radio' })

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
