<template>
  <div
    class="md-check-base-box"
    :class="[
      iconPosition,
      {
        'is-disabled': disabled,
        'is-checked': isChecked,
      },
    ]"
  >
    <slot></slot>
    <MdTag v-if="isChecked" size="tiny" shape="quarter" type="fill">
      <MdIcon name="right" size="xs"></MdIcon>
    </MdTag>
  </div>
</template>

<script setup lang="ts">
import MdTag from '../tag/Tag.vue'
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-check-base-box' })

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
