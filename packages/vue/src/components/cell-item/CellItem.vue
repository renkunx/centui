<template>
  <div
    class="md-cell-item"
    :class="{ 'is-disabled': disabled, 'no-border': noBorder }"
    @click="onClick"
  >
    <div class="md-cell-item-body" :class="{ multilines: !!brief }">
      <div v-if="$slots.left" class="md-cell-item-left">
        <slot name="left"></slot>
      </div>
      <div v-if="title || brief || $slots.default" class="md-cell-item-content">
        <p v-if="title" class="md-cell-item-title" v-text="title"></p>
        <p v-if="brief" class="md-cell-item-brief" v-text="brief"></p>
        <slot></slot>
      </div>
      <div v-if="arrow || addon || $slots.right" class="md-cell-item-right">
        <slot name="right">{{ addon }}</slot>
        <MdIcon v-if="arrow" name="arrow" size="md" />
      </div>
    </div>
    <div v-if="$slots.children" class="md-cell-item-children">
      <slot name="children"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import MdIcon from '../icon/Icon.vue'

defineOptions({ name: 'md-cell-item' })

const props = withDefaults(
  defineProps<{
    title?: string
    brief?: string
    addon?: string
    arrow?: boolean
    disabled?: boolean
    noBorder?: boolean
  }>(),
  {
    title: '',
    brief: '',
    addon: '',
    arrow: false,
    disabled: false,
    noBorder: false,
  },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

function onClick(e: MouseEvent) {
  if (!props.disabled) {
    emit('click', e)
  }
}
</script>
