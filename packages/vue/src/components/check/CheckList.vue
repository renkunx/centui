<template>
  <CuCheckGroup
    ref="group"
    class="cu-check-list"
    :class="{ 'is-align-center': alignCenter }"
    :model-value="modelValue"
    @update:model-value="onInput"
  >
    <CuCellItem
      v-for="(item, index) in options"
      :key="index"
      class="cu-check-item"
      :class="{
        'is-checked': modelValue.indexOf(item.value) !== -1,
      }"
      :title="hasSlot ? '' : item.text || item.label"
      :brief="hasSlot ? '' : item.brief"
      :disabled="item.disabled"
      @click="check(item)"
    >
      <template v-if="hasSlot">
        <slot :option="item" :index="index" :selected="modelValue.indexOf(item.value) > -1"></slot>
      </template>
      <template v-if="!alignCenter" #[iconSlotName]>
        <CuCheck
          :name="item.value"
          :disabled="item.disabled"
          :size="iconSize"
          :icon="icon"
          :icon-inverse="iconInverse"
          :icon-disabled="iconDisabled"
          :icon-svg="iconSvg"
        />
      </template>
    </CuCellItem>
  </CuCheckGroup>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import CuCheck from './Check.vue'
import CuCheckGroup from './CheckGroup.vue'
import CuCellItem from '../cell-item/CellItem.vue'

defineOptions({ name: 'cu-check-list' })

const props = withDefaults(
  defineProps<{
    options?: CheckListOption[]
    modelValue?: Array<string | number | boolean>
    alignCenter?: boolean
    isSlotScope?: boolean
    icon?: string
    iconInverse?: string
    iconDisabled?: string
    iconSvg?: boolean
    iconSize?: string
    iconPosition?: string
  }>(),
  {
    options: () => [],
    modelValue: () => [],
    alignCenter: false,
    isSlotScope: undefined,
    icon: 'checked',
    iconInverse: 'check',
    iconDisabled: 'check-disabled',
    iconSvg: false,
    iconSize: 'md',
    iconPosition: 'right',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Array<string | number | boolean>): void
}>()

const slots = useSlots()
const group = ref<InstanceType<typeof CuCheckGroup>>()

const hasSlot = computed(() =>
  props.isSlotScope !== undefined ? props.isSlotScope : !!slots.default,
)

const iconSlotName = computed(() => (props.iconPosition === 'right' ? 'right' : 'left'))

function check(option: CheckListOption) {
  group.value?.toggle?.(option.value)
}

function onInput(value: Array<string | number | boolean>) {
  emit('update:modelValue', value)
}
</script>

<script lang="ts">
export interface CheckListOption {
  value: string | number | boolean
  text?: string
  label?: string
  brief?: string
  disabled?: boolean
}
</script>
