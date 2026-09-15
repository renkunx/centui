<template>
  <button
    :type="nativeType"
    class="md-button"
    :class="[
      type,
      inactive ? 'inactive' : 'active',
      inline ? 'inline' : 'block',
      round ? 'round' : '',
      plain ? 'plain' : '',
      size === 'small' ? 'small' : '',
    ]"
    :disabled="inactive || type === 'disabled'"
  >
    <div class="md-button-inner">
      <template v-if="loading">
        <MdActivityIndicatorRolling class="md-button-loading"></MdActivityIndicatorRolling>
      </template>
      <template v-else-if="icon">
        <MdIcon :name="icon" :svg="iconSvg"></MdIcon>
      </template>
      <div class="md-button-content">
        <slot></slot>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import MdActivityIndicatorRolling from '../activity-indicator/Roller.vue'
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-button' })

withDefaults(
  defineProps<{
    /** default | primary | warning | disabled | link */
    type?: string
    nativeType?: 'button' | 'submit' | 'reset'
    icon?: string
    iconSvg?: boolean
    /** large | small */
    size?: string
    plain?: boolean
    round?: boolean
    inline?: boolean
    inactive?: boolean
    loading?: boolean
  }>(),
  {
    type: 'default',
    nativeType: 'button',
    icon: '',
    iconSvg: false,
    size: 'large',
    plain: false,
    round: false,
    inline: false,
    inactive: false,
    loading: false,
  },
)
</script>
