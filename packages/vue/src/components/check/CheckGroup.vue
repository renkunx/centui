<template>
  <div class="cu-check-group">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { type CheckRootGroup } from './shared'

defineOptions({ name: 'cu-check-group' })

const props = withDefaults(
  defineProps<{
    modelValue?: Array<string | number | boolean>
    max?: number
  }>(),
  {
    modelValue: () => [],
    max: 0,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Array<string | number | boolean>): void
}>()

const children: Record<string, { name: string | number | boolean; disabled?: boolean }> = {}

const rootGroup: CheckRootGroup = {
  get value() {
    return props.modelValue
  },
  register(child) {
    if (child.name !== true && child.name !== '') {
      children[String(child.name)] = child
    }
  },
  unregister(child) {
    delete children[String(child.name)]
  },
  check(name) {
    const index = props.modelValue.indexOf(name)
    if (index === -1 && (props.max < 1 || props.modelValue.length < props.max)) {
      emit('update:modelValue', props.modelValue.concat(name))
    }
  },
  uncheck(name) {
    const index = props.modelValue.indexOf(name)
    if (index !== -1) {
      emit(
        'update:modelValue',
        props.modelValue.slice(0, index).concat(props.modelValue.slice(index + 1)),
      )
    }
  },
  toggle(name) {
    const index = props.modelValue.indexOf(name)
    if (index === -1) {
      rootGroup.check(name)
    } else {
      rootGroup.uncheck(name)
    }
  },
  toggleAll(checked?: boolean) {
    const names = Object.keys(children).filter((name) => {
      const child = children[name]
      const isChecked = !!~props.modelValue.indexOf(child.name as string | number | boolean)

      // disabled options retain original status
      if (child.disabled) {
        return isChecked
      }
      return checked === false ? false : !checked ? !isChecked : true
    })
    emit('update:modelValue', names)
  },
}

provide('rootGroup', rootGroup)

defineExpose({ toggle: rootGroup.toggle, toggleAll: rootGroup.toggleAll })
</script>
