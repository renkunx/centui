<template>
  <svg
    v-if="svg"
    class="md-icon icon-svg"
    :class="[`md-icon-${name}`, size]"
    :style="{ fill: color }"
    @click="$emit('click', $event)"
  >
    <use :xlink:href="`#${name}`" />
  </svg>
  <i
    v-else-if="name"
    class="md-icon icon-font"
    :class="[`md-icon-${name}`, name, size]"
    :style="{ color }"
    @click="$emit('click', $event)"
  ></i>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { loadSprite } from './load-sprite'

defineOptions({ name: 'md-icon' })

withDefaults(
  defineProps<{
    /** 图标名（svg sprite id 或字体图标类名） */
    name: string
    /** xss | xs | sm | md | lg */
    size?: string
    color?: string
    /** true 渲染 svg sprite，false 渲染 icon font */
    svg?: boolean
  }>(),
  {
    size: 'md',
    color: '',
    svg: true,
  },
)

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

onMounted(() => {
  loadSprite()
})
</script>
