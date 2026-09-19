<template>
  <div class="md-cashier-block-btn">
    <MdButton
      v-for="(action, index) in actions"
      :key="index"
      :type="index === actions.length - 1 ? 'primary' : 'default'"
      :inline="actions.length > 1"
      @click="() => action.handler && action.handler()"
    >
      {{ action.buttonText }}
    </MdButton>
  </div>
</template>

<script setup lang="ts">
import MdButton from '../button/Button.vue'

defineOptions({ name: 'md-cashier-channel-button' })

withDefaults(
  defineProps<{
    actions?: Array<{ buttonText?: string; handler?: (() => void) | null }>
  }>(),
  { actions: () => [] },
)
</script>
