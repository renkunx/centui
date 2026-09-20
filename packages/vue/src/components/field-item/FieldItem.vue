<template>
  <div
    class="cu-field-item"
    :class="[
      solid ? 'is-solid' : '',
      currentDisabled ? 'is-disabled' : '',
      alignRight ? 'is-align-right' : '',
      inputEnv,
    ]"
    @click="onClick"
  >
    <div class="cu-field-item-content">
      <label v-if="title" class="cu-field-item-title" v-text="title"></label>
      <div v-if="hasSlot('left')" class="cu-field-item-left">
        <slot name="left"></slot>
      </div>
      <div class="cu-field-item-control">
        <slot>
          <template v-if="content">{{ content }}</template>
          <div v-else-if="placeholder" class="cu-field-item-placeholder" v-text="placeholder"></div>
        </slot>
      </div>
      <div v-if="arrow || addon || hasSlot('right')" class="cu-field-item-right">
        <slot name="right">{{ addon }}</slot>
        <CuIcon v-if="arrow" :name="arrow === true ? 'arrow' : arrow" size="md" />
      </div>
    </div>
    <div v-if="hasSlot('children')" class="cu-field-item-children">
      <slot name="children"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, useSlots, Comment, Fragment, Text, type VNode } from 'vue'
import { isAndroid, isIOS } from '@centui/core'
import CuIcon from '../icon/Icon.vue'

defineOptions({ name: 'cu-field-item' })

const props = withDefaults(
  defineProps<{
    title?: string
    placeholder?: string
    content?: string
    addon?: string
    arrow?: boolean | string
    solid?: boolean
    alignRight?: boolean
    disabled?: boolean
  }>(),
  {
    title: '',
    placeholder: '',
    content: '',
    addon: '',
    arrow: false,
    solid: false,
    alignRight: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const slots = useSlots()
const rootField = inject<{ disabled?: boolean } | null>('rootField', null)

// v3 语义适配：插槽函数始终存在，需确认渲染结果非空（等价 v2 $slots.xxx 真值判断）。
// 仅含注释占位、空 Fragment（内部为 InputItem 的空插槽出口）或纯空白文本视为无内容。
function isVNodeEmpty(node: VNode): boolean {
  if (node.type === Comment) {
    return true
  }
  if (node.type === Text) {
    return !String(node.children).trim()
  }
  if (node.type === Fragment) {
    const children = node.children as VNode[]
    return !Array.isArray(children) || children.every(isVNodeEmpty)
  }
  return false
}

function hasSlot(name: 'left' | 'right' | 'children'): boolean {
  const fn = slots[name]
  if (!fn) {
    return false
  }
  return fn().some((node) => !isVNodeEmpty(node))
}

const inputEnv = computed(() => {
  if (isIOS) {
    return 'is-ios'
  } else if (isAndroid) {
    return 'is-android'
  }
  return 'is-browser'
})

const currentDisabled = computed(() => !!rootField?.disabled || props.disabled)

function onClick(e: MouseEvent) {
  if (!currentDisabled.value) {
    emit('click', e)
  }
}
</script>
