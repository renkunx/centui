<template>
  <div class="md-license-plate-input">
    <div
      v-for="(item, index) in keyArray"
      :key="index"
      class="md-license-plate-input-item"
      :class="{
        active: selectedIndex === index,
        animation: selectedIndex === index && !item,
      }"
      @click="$emit('key-mapping', index)"
    >
      <!-- 非新能源键位 -->
      <div v-if="index !== keyArray.length - 1" class="md-license-plate-input-item_content">
        {{ item }}
      </div>
      <!-- 新能源键位 -->
      <div v-else class="md-license-plate-input-item_content">
        <div v-if="item && item !== ' '">{{ item }}</div>
        <div v-else class="emptyValue"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'md-license-plate-input' })

withDefaults(
  defineProps<{
    keyArray?: string[]
    selectedIndex?: number
  }>(),
  { keyArray: () => [], selectedIndex: 0 },
)

defineEmits<{
  (e: 'key-mapping', index: number): void
}>()
</script>
