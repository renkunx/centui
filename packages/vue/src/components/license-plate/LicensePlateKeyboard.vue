<template>
  <div class="cu-license-plate-keyboard">
    <!-- 省份简写键盘（第一位） -->
    <div v-if="keyboardType === 1" class="cu-shortcut-row">
      <div
        v-for="(item, index) in shortcuts"
        :key="index"
        class="cu-shortcut-row-item"
        @click="$emit('enter', item)"
      >
        {{ item }}
      </div>
    </div>
    <!-- 字母数字混合键盘（第二位起） -->
    <div v-else class="cu-mixed-key-board">
      <div
        v-for="(item, index) in mixedKeyboard"
        :key="index"
        class="cu-mixed-key-board-item"
        :class="{ disabled: item.disabled }"
      >
        <template v-if="item.type">
          <div
            :class="item.type"
            @click="item.type === 'delete' ? $emit('delete') : $emit('confirm')"
          >
            <div v-if="item.type === 'confirm' && item.text">{{ item.text }}</div>
          </div>
        </template>
        <template v-else>
          <div @click="!item.disabled && $emit('enter', item.value)">{{ item.value }}</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'cu-license-plate-keyboard' })

export interface LicenseKeyItem {
  value?: string | number
  type?: 'delete' | 'confirm'
  text?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    keyboard?: {
      shortcuts?: string[]
      mixedKeyboard?: LicenseKeyItem[]
      keyboardType?: number
    }
  }>(),
  { keyboard: () => ({}) },
)

defineEmits<{
  (e: 'enter', value: string | number | undefined): void
  (e: 'delete'): void
  (e: 'confirm'): void
}>()

const shortcuts = computed(() => props.keyboard.shortcuts || [])
const keyboardType = computed(() => props.keyboard.keyboardType || 1)
const mixedKeyboard = computed(() => props.keyboard.mixedKeyboard || [])
</script>
