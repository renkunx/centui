<template>
  <div class="cu-cashier-channel-item">
    <div v-if="data.icon" class="item-icon" :class="data.icon">
      <CuIcon :name="data.icon" size="lg"></CuIcon>
    </div>
    <div v-else-if="data.img" class="item-image">
      <img :src="data.img" />
    </div>
    <div class="item-label">
      <p class="title">
        <span v-html="data.text || data"></span>
        <span
          v-if="data.action"
          class="title-active"
          v-html="data.action.text"
          @click.stop="data.action.handler"
        ></span>
      </p>
      <p v-if="data.desc" class="desc" v-html="data.desc"></p>
    </div>
    <div class="item-check-icon">
      <CuIcon v-if="data.disabled" name="check-disabled"></CuIcon>
      <CuIcon v-else-if="active" name="checked"></CuIcon>
      <CuIcon v-else name="check"></CuIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-cashier-channel-item' })

const props = withDefaults(
  defineProps<{
    data?: {
      icon?: string
      img?: string
      text?: string
      desc?: string
      disabled?: boolean
      action?: { text: string; handler: () => void }
    }
    active?: boolean
  }>(),
  { data: () => ({}), active: false },
)
void props
</script>
