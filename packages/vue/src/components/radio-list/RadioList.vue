<template>
  <div class="md-radio-list" :class="{ 'is-align-center': alignCenter }">
    <MdCellItem
      v-for="(item, index) in options"
      :key="index"
      class="md-radio-item"
      :class="{
        'is-selected': selectedValue === item.value && !inputSelected,
      }"
      :title="hasSlot ? '' : item.text || item.label"
      :brief="hasSlot ? '' : item.brief"
      :disabled="item.disabled"
      :no-border="index === options.length - 1"
      @click="select(item, index)"
    >
      <template v-if="hasSlot">
        <slot :option="item" :index="index" :selected="currentValue === item.value"></slot>
      </template>
      <template v-if="!alignCenter && !inputSelected && !withoutIcon" #[iconSlotName]>
        <MdRadio
          :name="item.value"
          :model-value="selectedValue"
          :disabled="item.disabled"
          :size="iconSize"
          :icon="icon"
          :icon-inverse="iconInverse"
          :icon-disabled="iconDisabled"
          :icon-svg="iconSvg"
        />
      </template>
    </MdCellItem>
    <MdInputItem
      v-if="hasInput"
      ref="inputItem"
      class="md-radio-item"
      :class="{
        'is-selected': inputSelected,
      }"
      :title="inputLabel"
      :placeholder="inputPlaceholder"
      :model-value="inputValue"
      @update:model-value="value => (inputValue = value)"
      @focus="inputSelected = true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import MdRadio from '../radio/Radio.vue'
import MdCellItem from '../cell-item/CellItem.vue'
import MdInputItem from '../input-item/InputItem.vue'

defineOptions({ name: 'md-radio-list' })

const props = withDefaults(
  defineProps<{
    options?: RadioListOption[]
    modelValue?: string | number | boolean
    hasInput?: boolean
    inputLabel?: string
    inputPlaceholder?: string
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
    modelValue: '',
    hasInput: false,
    inputLabel: '',
    inputPlaceholder: '',
    alignCenter: false,
    isSlotScope: undefined,
    icon: 'checked',
    iconInverse: 'check',
    iconDisabled: 'check-disabled',
    iconSvg: false,
    iconSize: 'md',
    iconPosition: 'left',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | boolean): void
  (e: 'change', option: RadioListOption, index: number): void
}>()

const slots = useSlots()
const inputItem = ref<InstanceType<typeof MdInputItem>>()

const selectedValue = ref(props.modelValue)
const inputSelected = ref(false)
const inputValue = ref('')

const currentValue = computed(() => (inputSelected.value ? inputValue.value : selectedValue.value))
const hasSlot = computed(() =>
  props.isSlotScope !== undefined ? props.isSlotScope : !!slots.default,
)
const withoutIcon = computed(() => props.isSlotScope && !props.icon)
const iconSlotName = computed(() => (props.iconPosition === 'right' ? 'right' : 'left'))

watch(
  () => props.modelValue,
  val => {
    if (val !== selectedValue.value) {
      selectedValue.value = val
    }
  },
)

watch(currentValue, val => {
  emit('update:modelValue', val)
})

function select(option: RadioListOption, index: number) {
  selectedValue.value = option.value
  inputSelected.value = false
  if (inputValue.value) {
    inputValue.value = ''
  }
  emit('change', option, index)
}

function selectByValue(value: string | number | boolean) {
  selectedValue.value = value
  inputSelected.value = false
}

function selectByIndex(index: number) {
  const item = props.options[index]
  if (item) {
    selectByValue(item.value)
  }
}

defineExpose({ select: selectByValue, selectByIndex })
</script>

<script lang="ts">
export interface RadioListOption {
  value: string | number | boolean
  text?: string
  label?: string
  brief?: string
  disabled?: boolean
}
</script>
