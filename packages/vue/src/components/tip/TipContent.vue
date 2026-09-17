<template>
  <div class="md-tip" :class="wrapperCls">
    <div class="md-tip-content">
      <template v-if="!$slots.default">
        <MdIcon v-if="icon" class="content-icon" :name="icon" :svg="iconSvg" />
        <div class="content-text" v-text="content"></div>
      </template>
      <template v-else>
        <slot></slot>
      </template>
      <MdIcon v-if="closable" name="close" size="md" @click="onClose" />
    </div>
    <div class="md-tip-bg"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-tip-content' })

const props = withDefaults(
  defineProps<{
    /** top | left | bottom | right */
    placement?: string
    closable?: boolean
    icon?: string
    iconSvg?: boolean
    content?: string | number
    name?: string | number
  }>(),
  {
    placement: 'top',
    closable: true,
    icon: undefined,
    iconSvg: false,
    content: '',
    name: undefined,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const wrapperCls = computed(() => ({
  'has-close': props.closable,
  [`is-${props.placement}`]: ['left', 'bottom', 'right'].includes(props.placement as string),
  [String(props.name)]: !!props.name,
}))

function onClose() {
  emit('close')
}
</script>
