<template>
  <button
    :type="nativeType"
    class="cu-button"
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
    <div class="cu-button-inner">
      <template v-if="loading">
        <CuActivityIndicatorRolling class="cu-button-loading"></CuActivityIndicatorRolling>
      </template>
      <template v-else-if="icon">
        <CuIcon :name="icon" :svg="iconSvg"></CuIcon>
      </template>
      <div class="cu-button-content">
        <slot></slot>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import CuActivityIndicatorRolling from '../activity-indicator/Roller.vue'
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-button' })

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
