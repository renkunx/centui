<template>
  <div class="cu-agree" :class="[disabled ? 'disabled' : '']">
    <div class="cu-agree-icon" :class="[modelValue ? 'checked' : '']" @click="onChange($event)">
      <div class="cu-agree-icon-container">
        <slot name="icon" :checked="modelValue">
          <span v-if="iconType === 'square'">
            <CuIcon name="square-checked" :size="size"></CuIcon>
            <CuIcon name="square-check" :size="size"></CuIcon>
          </span>
          <span v-else>
            <CuIcon name="checked" :size="size"></CuIcon>
            <CuIcon name="check" :size="size"></CuIcon>
          </span>
        </slot>
      </div>
    </div>
    <div class="cu-agree-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-agree' })

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
