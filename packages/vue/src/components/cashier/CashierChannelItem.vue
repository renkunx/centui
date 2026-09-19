<template>
  <div class="md-cashier-channel-item">
    <div v-if="data.icon" class="item-icon" :class="data.icon">
      <MdIcon :name="data.icon" size="lg"></MdIcon>
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
      <MdIcon v-if="data.disabled" name="check-disabled"></MdIcon>
      <MdIcon v-else-if="active" name="checked"></MdIcon>
      <MdIcon v-else name="check"></MdIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-cashier-channel-item' })

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
