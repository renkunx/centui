<template>
  <div
    class="cu-check-base-box"
    :class="[
      iconPosition,
      {
        'is-disabled': disabled,
        'is-checked': isChecked,
      },
    ]"
  >
    <slot></slot>
    <CuTag v-if="isChecked" size="tiny" shape="quarter" type="fill">
      <CuIcon name="right" size="xs"></CuIcon>
    </CuTag>
  </div>
</template>

<script setup lang="ts">
import CuTag from '../tag/Tag.vue'
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-check-base-box' })

withDefaults(
  defineProps<{
    label?: string
    disabled?: boolean
    isChecked?: boolean
    /** lt | rt */
    iconPosition?: string
  }>(),
  {
    label: '',
    disabled: false,
    isChecked: false,
    iconPosition: 'rt',
  },
)
</script>
