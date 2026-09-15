<template>
  <div class="md-agree" :class="[disabled ? 'disabled' : '']">
    <div class="md-agree-icon" :class="[modelValue ? 'checked' : '']" @click="onChange($event)">
      <div class="md-agree-icon-container">
        <slot name="icon" :checked="modelValue">
          <span v-if="iconType === 'square'">
            <MdIcon name="square-checked" :size="size"></MdIcon>
            <MdIcon name="square-check" :size="size"></MdIcon>
          </span>
          <span v-else>
            <MdIcon name="checked" :size="size"></MdIcon>
            <MdIcon name="check" :size="size"></MdIcon>
          </span>
        </slot>
      </div>
    </div>
    <div class="md-agree-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-agree' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    disabled?: boolean
    size?: string
    /** circle | square */
    iconType?: string
  }>(),
  {
    modelValue: false,
    disabled: false,
    size: 'md',
    iconType: 'circle',
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
