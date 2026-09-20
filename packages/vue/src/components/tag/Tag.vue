<template>
  <div class="cu-tag">
    <template v-if="shape === 'quarter'">
      <div :class="computedClass">
        <div class="quarter-content">
          <slot></slot>
        </div>
        <div class="quarter-bg" :style="colorStyle"></div>
      </div>
    </template>
    <template v-else-if="shape === 'coupon'">
      <div :class="computedClass">
        <div class="coupon-container" :style="colorStyle">
          <div
            v-if="shape === 'coupon'"
            class="left-coupon"
            :style="{
              background: fillColor
                ? 'radial-gradient(circle at left, transparent 33%, ' + fillColor + ' 33%)'
                : '',
            }"
          ></div>
          <slot></slot>
          <div
            v-if="shape === 'coupon'"
            class="right-coupon"
            :style="{
              background: fillColor
                ? 'radial-gradient(circle at right, transparent 33%, ' + fillColor + ' 33%)'
                : '',
            }"
          ></div>
        </div>
      </div>
    </template>
    <template v-else>
      <div ref="el" :class="computedClass" :style="[colorStyle, sizeStyle]">
        <slot></slot>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { transformCamelCase } from '@centui/core'

defineOptions({ name: 'cu-tag' })

const props = withDefaults(
  defineProps<{
    /** tiny | small | large */
    size?: string
    /** square | circle | fillet | quarter | coupon | bubble */
    shape?: string
    /** top-left | top-right | bottom-left | bottom-right */
    sharp?: string
    /** fill | ghost */
    type?: string
    fillColor?: string
    /** normal | bold | bolder */
    fontWeight?: string
    fontColor?: string
  }>(),
  {
    size: 'large',
    shape: 'square',
    sharp: '',
    type: 'ghost',
    fillColor: '',
    fontWeight: 'normal',
    fontColor: '',
  },
)

const el = ref<HTMLElement>()

const sizeStyle = reactive<Record<string, string>>({})

const computedClass = computed(() => [
  'default',
  `size-${props.size}`,
  `shape-${props.shape}`,
  `type-${props.type}`,
  `font-weight-${props.fontWeight}`,
])

const colorStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.type === 'fill' && props.fillColor) {
    style.background = props.fillColor
  }
  if (props.fontColor) {
    if (props.type === 'ghost') {
      style.borderColor = props.fontColor
    }
    style.color = props.fontColor
  }
  return style
})

onMounted(async () => {
  await nextTick()
  if (props.shape === 'circle' && el.value) {
    const radius = el.value.offsetHeight / 2
    sizeStyle.paddingLeft = radius + 'px'
    sizeStyle.paddingRight = radius + 'px'
    sizeStyle.borderRadius = radius + 'px'
    if (props.sharp) {
      sizeStyle[transformCamelCase(`border-${props.sharp}-radius`)] = '0'
    }
  }
})
</script>
