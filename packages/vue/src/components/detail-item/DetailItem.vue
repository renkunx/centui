<template>
  <div class="md-detail-item" :class="{ 'is-bold': bold }">
    <div class="md-detail-title" v-text="title"></div>
    <div class="md-detail-content">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'md-detail-item' })

withDefaults(
  defineProps<{
    title?: string
    content?: string | number
    bold?: boolean
  }>(),
  { title: '', content: '', bold: false },
)
</script>
