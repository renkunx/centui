<template>
  <CuWaterMark class="cu-bill" :content="waterMark">
    <header class="cu-bill-header">
      <template v-if="!hasHeaderSlot">
        <h4 v-if="title" class="cu-bill-title" v-text="title"></h4>
        <div v-if="no" class="cu-bill-no">NO.{{ no }}</div>
      </template>
      <template v-else>
        <slot name="header"></slot>
      </template>
    </header>
    <div class="cu-bill-neck">
      <span></span>
    </div>
    <div class="cu-bill-content">
      <div class="cu-bill-detail">
        <slot></slot>
      </div>
      <footer v-if="hasFooterSlot" class="cu-bill-footer">
        <slot name="footer"></slot>
      </footer>
    </div>
    <template v-if="hasWatermarkSlot" #watermark="{ coord }">
      <slot name="watermark" :coord="coord"></slot>
    </template>
  </CuWaterMark>
</template>

<script setup lang="ts">
import { computed, useSlots, Comment, Fragment } from 'vue'
import CuWaterMark from '../water-mark/WaterMark.vue'

defineOptions({ name: 'cu-bill' })

const props = withDefaults(
  defineProps<{
    title?: string
    no?: string | number
    waterMark?: string
  }>(),
  { title: '', no: '', waterMark: '' },
)

const slots = useSlots()

function slotHasContent(name: 'header' | 'footer' | 'watermark'): boolean {
  const fn = slots[name]
  if (!fn) {
    return false
  }
  const args = name === 'watermark' ? [{ coord: { row: 1, col: 1 } }] : []
  return fn(...(args as never[])).some((node) => {
    if (!node || typeof node !== 'object') {
      return false
    }
    const n = node as { type: unknown; children?: unknown }
    if (n.type === Comment) {
      return false
    }
    if (n.type === Fragment) {
      const children = n.children as unknown[]
      return Array.isArray(children) && children.length > 0
    }
    return true
  })
}

const hasHeaderSlot = computed(() => slotHasContent('header'))
const hasFooterSlot = computed(() => slotHasContent('footer'))
const hasWatermarkSlot = computed(() => slotHasContent('watermark'))
</script>
