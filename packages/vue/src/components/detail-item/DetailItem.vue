<template>
  <div class="cu-detail-item" :class="{ 'is-bold': bold }">
    <div class="cu-detail-title" v-text="title"></div>
    <div class="cu-detail-content">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'cu-detail-item' })

withDefaults(
  defineProps<{
    title?: string
    content?: string | number
    bold?: boolean
  }>(),
  { title: '', content: '', bold: false },
)
</script>
