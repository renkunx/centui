<template>
  <div class="cu-cashier-block-btn">
    <CuButton
      v-for="(action, index) in actions"
      :key="index"
      :type="index === actions.length - 1 ? 'primary' : 'default'"
      :inline="actions.length > 1"
      @click="() => action.handler && action.handler()"
    >
      {{ action.buttonText }}
    </CuButton>
  </div>
</template>

<script setup lang="ts">
import CuButton from '../button/Button.vue'

defineOptions({ name: 'cu-cashier-channel-button' })

withDefaults(
  defineProps<{
    actions?: Array<{ buttonText?: string; handler?: (() => void) | null }>
  }>(),
  { actions: () => [] },
)
</script>
