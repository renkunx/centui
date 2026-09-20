<template>
  <div
    class="cu-cell-item"
    :class="{ 'is-disabled': disabled, 'no-border': noBorder }"
    @click="onClick"
  >
    <div class="cu-cell-item-body" :class="{ multilines: !!brief }">
      <div v-if="$slots.left" class="cu-cell-item-left">
        <slot name="left"></slot>
      </div>
      <div v-if="title || brief || $slots.default" class="cu-cell-item-content">
        <p v-if="title" class="cu-cell-item-title" v-text="title"></p>
        <p v-if="brief" class="cu-cell-item-brief" v-text="brief"></p>
        <slot></slot>
      </div>
      <div v-if="arrow || addon || $slots.right" class="cu-cell-item-right">
        <slot name="right">{{ addon }}</slot>
        <CuIcon v-if="arrow" name="arrow" size="md" />
      </div>
    </div>
    <div v-if="$slots.children" class="cu-cell-item-children">
      <slot name="children"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-cell-item' })

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
