<template>
  <div class="md-action-bar">
    <div class="md-action-bar-container">
      <div v-if="hasSlots" class="md-action-bar-text">
        <slot></slot>
      </div>
      <div class="md-action-bar-group">
        <MdButton
          v-for="(item, index) in coerceActions"
          :key="index"
          class="md-action-bar-button"
          :type="item.type || (item.disabled ? 'disabled' : 'primary')"
          :plain="item.plain || index !== coerceActions.length - 1"
          :round="item.round"
          :inactive="item.inactive"
          :loading="item.loading"
          :icon="item.icon"
          :icon-svg="item.iconSvg"
          @click="onBtnClick($event, item)"
        >
          {{ item.text }}
        </MdButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots, Comment, Fragment, Text, type VNode } from 'vue'
import MdButton from '../button/Button.vue'

defineOptions({ name: 'md-action-bar' })

export interface ActionBarAction {
  text?: string
  type?: string
  plain?: boolean
  round?: boolean
  inactive?: boolean
  loading?: boolean
  icon?: string
  iconSvg?: boolean
  disabled?: boolean
  onClick?: (event: MouseEvent, action: ActionBarAction) => void
}

const props = withDefaults(
  defineProps<{
    actions?: Array<ActionBarAction>
  }>(),
  { actions: () => [] },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent, action: ActionBarAction): void
}>()

const slots = useSlots()

// v2 契约：actions 最多展示两个
const coerceActions = computed(() => props.actions.slice(0, 2))
// v3 语义适配：插槽函数始终存在，需确认渲染结果非空（等价 v2 isEmptyObject($slots)）
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

const hasSlots = computed(() => {
  const fn = slots.default
  if (!fn) {
    return false
  }
  return fn().some((node) => !isVNodeEmpty(node))
})

function onBtnClick(event: MouseEvent, action: ActionBarAction) {
  action.onClick?.(event, action)
  emit('click', event, action)
}
</script>
