<template>
  <div v-if="loading" class="md-skeleton">
    <div
      v-if="avatar"
      :class="{
        'md-skeleton-avatar': true,
        'md-skeleton-avatar-large': avatarSize === 'lg',
        'md-skeleton-avatar-small': avatarSize === 'sm',
      }"
    ></div>
    <div class="md-skeleton-content">
      <h4 v-if="title" class="md-skeleton-title" :style="{ width: titleWidthStyle }" />
      <div
        v-for="index in row"
        :key="index"
        class="md-skeleton-row"
        :style="{ width: index === row ? '60%' : rowWidthStyle(index - 1) }"
      ></div>
    </div>
  </div>
  <div v-else>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
const DEFAULT_TITLE_WIDTH = '40%'
const DEFAULT_WIDTH = '100%'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    avatar?: boolean
    row?: number
    title?: boolean
    titleWidth?: number | string
    rowWidth?: number | string | Array<number | string>
    avatarSize?: string
  }>(),
  {
    loading: true,
    avatar: false,
    row: 3,
    title: false,
    titleWidth: DEFAULT_TITLE_WIDTH,
    rowWidth: DEFAULT_WIDTH,
    avatarSize: 'md',
  },
)

function isNumber(n: unknown): n is number {
  return typeof n === 'number'
}

function rowWidthStyle(index: number): string {
  const { rowWidth } = props
  if (Array.isArray(rowWidth)) {
    if (rowWidth[index] == null) {
      return DEFAULT_WIDTH
    }
    return isNumber(rowWidth[index]) ? `${rowWidth[index]}%` : String(rowWidth[index])
  }
  if (rowWidth) {
    return isNumber(rowWidth) ? `${rowWidth}%` : String(rowWidth)
  }
  return DEFAULT_WIDTH
}

const titleWidthStyle = isNumber(props.titleWidth)
  ? `${props.titleWidth}%`
  : String(props.titleWidth)
</script>
