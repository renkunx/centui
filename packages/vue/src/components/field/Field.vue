<template>
  <fieldset class="md-field" :class="{ 'is-plain': plain, 'is-disabled': disabled }">
    <header v-if="title || brief || $slots.header || $slots.action" class="md-field-header">
      <div class="md-field-heading">
        <legend v-if="title" class="md-field-title" v-text="title"></legend>
        <p v-if="brief" class="md-field-brief" v-text="brief"></p>
        <slot name="header"></slot>
      </div>
      <div class="md-field-action">
        <slot name="action"></slot>
      </div>
    </header>
    <div class="md-field-content">
      <slot></slot>
    </div>
    <footer v-if="$slots.footer" class="md-field-footer">
      <slot name="footer"></slot>
    </footer>
  </fieldset>
</template>

<script setup lang="ts">
import { provide, reactive } from 'vue'

defineOptions({ name: 'md-field' })

const props = withDefaults(
  defineProps<{
    title?: string
    brief?: string
    disabled?: boolean
    plain?: boolean
  }>(),
  {
    title: '',
    brief: '',
    disabled: false,
    plain: false,
  },
)

// v2 契约：Field 向表单子组件（InputItem 等）暴露自身状态
provide(
  'rootField',
  reactive({
    get disabled() {
      return props.disabled
    },
  }),
)
</script>
